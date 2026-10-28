const { test, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire } = require('node:module');
const serverRequire = createRequire(path.join(process.env.AVARA_SERVER_ROOT || path.resolve(__dirname, '..'), 'package.json'));
const mongoose = serverRequire('mongoose');
mongoose.set('bufferCommands', false);
const Listing = serverRequire('./models/Listing');
const Review = serverRequire('./models/Review');
const validation = serverRequire('./middleware/validation');
const auth = serverRequire('./middleware/auth');
const listings = serverRequire('./controllers/listingController');
const uploads = serverRequire('./controllers/uploadController');
const errorHandler = serverRequire('./middleware/errorHandler');
const fs = require('node:fs/promises');

afterEach(() => mock.restoreAll());
const id = () => new mongoose.Types.ObjectId();
const base = () => ({ title: 'Lake retreat', description: 'A quiet stay', location: 'Como', country: 'Italy', price: 0 });
function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}
function validate(body) {
  const req = { body };
  let next = false;
  validation.validateListing(req, {}, () => { next = true; });
  assert.equal(next, true);
  return req.validatedListing;
}

test('listing validation supports current form envelope, gallery and zero price', () => {
  const result = validate({ listing: base(), images: [{ url: '/uploads/listings/existing.jpg', isCover: true, _id: id().toString() }] });
  assert.equal(result.price, 0);
  assert.equal(result.images.length, 1);
});

test('listing validation prevents ownership, review and operator injection', () => {
  for (const fields of [{ owner: id().toString() }, { reviews: [id().toString()] }, { $set: { owner: id().toString() } }, { createdAt: new Date() }]) {
    assert.throws(() => validate({ ...base(), ...fields }), { statusCode: 400 });
  }
});

test('listing validation rejects malformed, empty and oversized galleries', () => {
  for (const images of [[null], [{}], [], Array(9).fill('https://example.com/image.jpg')]) {
    assert.throws(() => validate({ listing: base(), images }), { statusCode: 400 });
  }
});

test('legacy single-image payload remains supported', () => {
  assert.equal(validate({ ...base(), image: 'https://example.com/legacy.jpg' }).image, 'https://example.com/legacy.jpg');
});

test('reviews require nonblank comments and whole star ratings', () => {
  for (const review of [{ comment: '  ', rating: 5 }, { comment: 'Nice', rating: 2.5 }, { comment: 'Nice', rating: 6 }, { comment: 'Nice', rating: 5, author: id().toString() }]) {
    assert.throws(() => validation.validateReview({ body: { review } }, {}, () => {}), { statusCode: 400 });
  }
  const req = { body: { comment: ' Nice ', rating: '5' } };
  validation.validateReview(req, {}, () => {});
  assert.deepEqual(req.validatedReview, { comment: 'Nice', rating: 5 });
});

test('editing a gallery runs Mongoose save hooks and persists the new card cover', async () => {
  const owner = id();
  const listing = new Listing({ ...base(), owner, image: { url: 'https://example.com/old.jpg' }, images: [{ url: 'https://example.com/old.jpg', isCover: true }] });
  listing.isNew = false;
  const update = mock.method(Listing.collection, 'updateOne', async () => ({ acknowledged: true, matchedCount: 1 }));
  mock.method(listing, 'populate', async () => listing);
  const req = { params: { id: listing._id.toString() }, listing, body: {}, validatedListing: validate({ ...base(), images: [
    { url: 'https://example.com/first.jpg', isCover: false },
    { url: 'https://example.com/new-cover.jpg', isCover: true }
  ] }) };
  const res = response();
  await listings.updateListing(req, res);
  assert.equal(update.mock.callCount(), 1);
  assert.equal(listing.image.url, 'https://example.com/new-cover.jpg');
  assert.equal(res.body.listing.image.url, 'https://example.com/new-cover.jpg');
  assert.equal(listing.owner.toString(), owner.toString());
});

test('legacy image edits also update the gallery', async () => {
  const listing = new Listing({ ...base(), images: [{ url: 'https://example.com/old.jpg', isCover: true }] });
  listing.isNew = false;
  mock.method(Listing.collection, 'updateOne', async () => ({ acknowledged: true, matchedCount: 1 }));
  mock.method(listing, 'populate', async () => listing);
  await listings.updateListing({ params: { id: listing._id }, listing, body: {}, validatedListing: validate({ ...base(), image: 'https://example.com/legacy-new.jpg' }) }, response());
  assert.equal(listing.images[0].url, 'https://example.com/legacy-new.jpg');
});

test('search treats regex punctuation literally and repairs cover in read responses only', async () => {
  let query;
  const original = { ...base(), image: { url: 'old' }, images: [{ url: 'new', isCover: true }] };
  mock.method(Listing, 'find', value => {
    query = value;
    return { populate: () => ({ sort: async () => [original] }) };
  });
  const res = response();
  await listings.getAllListings({ query: { search: '[.*', country: 'I(t)' } }, res);
  assert.equal(query.$or[0].title.test('[.*'), true);
  assert.equal(query.$or[0].title.test('anything'), false);
  assert.equal(query.country.test('I(t)'), true);
  assert.equal(res.body.listings[0].image.url, 'new');
  assert.equal(original.image.url, 'old');
});

test('structured search parameters return a client error', async () => {
  await assert.rejects(listings.getAllListings({ query: { search: ['one', 'two'] } }, response()), { statusCode: 400 });
});

test('existing uploaded gallery URLs are preserved without filesystem writes', async () => {
  const mkdir = mock.method(fs, 'mkdir', async () => {});
  const write = mock.method(fs, 'writeFile', async () => {});
  const res = response();
  await uploads.uploadListingImages({ body: { images: [{ url: '/uploads/listings/residence_123_abc.jpg', filename: 'saved.jpg', isCover: true }] } }, res);
  assert.equal(res.body.images[0].url, '/uploads/listings/residence_123_abc.jpg');
  assert.equal(res.body.images[0].isCover, true);
  assert.equal(mkdir.mock.callCount(), 0);
  assert.equal(write.mock.callCount(), 0);
});

test('invalid upload batches are rejected before writing any files', async () => {
  const mkdir = mock.method(fs, 'mkdir', async () => {});
  const write = mock.method(fs, 'writeFile', async () => {});
  for (const images of [[null], [{}], [{ url: '/uploads/listings/../avatar.jpg' }], Array(9).fill('https://example.com/photo.jpg'), ['data:image/png;base64,aGVsbG8=', {}]]) {
    await assert.rejects(uploads.uploadListingImages({ body: { images } }, response()), { statusCode: 400 });
  }
  assert.equal(mkdir.mock.callCount(), 0);
  assert.equal(write.mock.callCount(), 0);
});

test('valid image data still uploads and returns a local gallery URL', async () => {
  mock.method(fs, 'mkdir', async () => {});
  const write = mock.method(fs, 'writeFile', async () => {});
  const res = response();
  await uploads.uploadListingImages({ body: { images: [{ dataUrl: 'data:image/png;base64,iVBORw0KGgo=', isCover: true }] } }, res);
  assert.equal(write.mock.callCount(), 1);
  assert.match(res.body.images[0].url, /^\/uploads\/listings\/residence_.*\.png$/);
});

test('ownerless legacy listings deny changes without crashing', async () => {
  mock.method(Listing, 'findById', async () => ({ owner: null }));
  const res = response();
  await auth.isOwner({ params: { id: id() }, user: { _id: id() } }, res, () => assert.fail('Must deny'));
  assert.equal(res.statusCode, 403);
});

test('review deletion rejects unrelated listing IDs before checking author', async () => {
  mock.method(Listing, 'findById', async () => ({ reviews: [id()] }));
  const lookup = mock.method(Review, 'findById', async () => assert.fail('Wrong listing'));
  const res = response();
  await auth.isReviewAuthor({ params: { id: id(), reviewId: id() }, user: { _id: id() } }, res, () => assert.fail('Must deny'));
  assert.equal(res.statusCode, 404);
  assert.equal(lookup.mock.callCount(), 0);
});

test('review deletion rejects missing listings and missing authors', async () => {
  const reviewId = id();
  const lookup = mock.method(Listing, 'findById', async () => null);
  const req = { params: { id: id(), reviewId }, user: { _id: id() } };
  let res = response();
  await auth.isReviewAuthor(req, res, () => assert.fail('Must deny'));
  assert.equal(res.statusCode, 404);
  lookup.mock.mockImplementation(async () => ({ reviews: [reviewId] }));
  mock.method(Review, 'findById', async () => ({ author: null }));
  res = response();
  await auth.isReviewAuthor(req, res, () => assert.fail('Must deny'));
  assert.equal(res.statusCode, 403);
});

test('review author can delete a review from its own listing', async () => {
  const reviewId = id(), userId = id();
  mock.method(Listing, 'findById', async () => ({ reviews: [reviewId] }));
  mock.method(Review, 'findById', async () => ({ author: userId }));
  let allowed = false;
  await auth.isReviewAuthor({ params: { id: id(), reviewId }, user: { _id: userId } }, response(), () => { allowed = true; });
  assert.equal(allowed, true);
});

test('invalid ObjectIds become 400 responses', () => {
  mock.method(console, 'error', () => {});
  const res = response();
  errorHandler(new mongoose.Error.CastError('ObjectId', 'bad', '_id'), {}, res, () => {});
  assert.equal(res.statusCode, 400);
});

test('HTTP routes reject anonymous writes and non-owner edits', async t => {
  const express = serverRequire('express');
  const app = express();
  app.use(express.json());
  const userId = id();
  app.use((req, res, next) => {
    req.isAuthenticated = () => req.headers['x-test-auth'] === 'yes';
    req.user = { _id: userId };
    next();
  });
  app.use('/api/listings', serverRequire('./routes/listingRoutes'));
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const listingId = id(), reviewId = id();
  for (const [method, endpoint] of [['POST', '/api/listings'], ['PUT', `/api/listings/${listingId}`], ['DELETE', `/api/listings/${listingId}`], ['POST', `/api/listings/${listingId}/reviews`], ['DELETE', `/api/listings/${listingId}/reviews/${reviewId}`]]) {
    const result = await fetch(origin + endpoint, { method });
    assert.equal(result.status, 401, method + ' ' + endpoint);
  }
  mock.method(Listing, 'findById', async () => ({ owner: id() }));
  const denied = await fetch(`${origin}/api/listings/${listingId}`, { method: 'PUT', headers: { 'x-test-auth': 'yes', 'Content-Type': 'application/json' }, body: JSON.stringify(base()) });
  assert.equal(denied.status, 403);
});
