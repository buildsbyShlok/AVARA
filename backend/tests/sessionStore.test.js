const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoSessionStore, createMongoSessionStore, SESSION_MAX_AGE } = require('../sessionStore');
const { startServer } = require('../server');
const { logout } = require('../controllers/authController');

afterEach(() => mock.restoreAll());
const call = (store, method, ...args) => new Promise((resolve, reject) => {
    store[method](...args, (error, result) => error ? reject(error) : resolve(result));
});

test('session initialization uses only its dedicated collection and expiry index', async () => {
    const collection = { async createIndex(keys, options) {
        assert.deepEqual(keys, { expires: 1 });
        assert.equal(options.expireAfterSeconds, 0);
    } };
    const store = await createMongoSessionStore({ readyState: 1, db: {
        collection(name) { assert.equal(name, 'avara_sessions'); return collection; }
    } });
    assert.ok(store instanceof MongoSessionStore);
    await assert.rejects(createMongoSessionStore({ readyState: 0 }), /connected MongoDB/);
});

test('sessions serialize with hashed IDs and preserve cookie expiry', async () => {
    const session = { cookie: { expires: new Date(Date.now() + 60000) }, passport: { user: 'curator' } };
    let record;
    const store = new MongoSessionStore({
        async updateOne(query, update, options) {
            assert.notEqual(query._id, 'session-id');
            assert.equal(query._id.length, 64);
            assert.equal(options.upsert, true);
            record = { _id: query._id, ...update.$set };
        },
        async findOne(query) {
            assert.equal(query._id, record._id);
            assert.ok(query.expires.$gt instanceof Date);
            return record;
        }
    });
    await call(store, 'set', 'session-id', session);
    assert.equal(record.expires.getTime(), session.cookie.expires.getTime());
    assert.deepEqual(await call(store, 'get', 'session-id'), JSON.parse(JSON.stringify(session)));
    const now = Date.now();
    const expires = store.expiry({ cookie: {} });
    assert.ok(expires.getTime() >= now + SESSION_MAX_AGE);
});

test('expired or missing sessions are unavailable; touch cannot upsert or overwrite data', async () => {
    const store = new MongoSessionStore({
        async findOne(query) { assert.ok(query.expires.$gt instanceof Date); return null; },
        async updateOne(query, update, options) {
            assert.ok(query.expires.$gt instanceof Date);
            assert.deepEqual(Object.keys(update.$set), ['expires']);
            assert.equal(options?.upsert, undefined);
        }
    });
    assert.equal(await call(store, 'get', 'expired'), null);
    await call(store, 'touch', 'expired', { cookie: {} });
});

test('destroy targets only the requested session', async () => {
    const store = new MongoSessionStore({ async deleteOne(query) {
        assert.deepEqual(query, { _id: store.key('logout-session') });
    } });
    await call(store, 'destroy', 'logout-session');
});

test('store failures and corrupt data reach callbacks without memory fallback', async () => {
    const failure = new Error('database unavailable');
    const store = new MongoSessionStore({
        async createIndex() { throw failure; }, async findOne() { throw failure; },
        async updateOne() { throw failure; }, async deleteOne() { throw failure; }
    });
    await assert.rejects(store.initialize(), failure);
    for (const method of ['get', 'set', 'touch', 'destroy']) {
        await assert.rejects(call(store, method, 'id', ...(['set', 'touch'].includes(method) ? [{}] : [])), failure);
    }
    const corrupt = new MongoSessionStore({ async findOne() { return { session: '{bad json' }; } });
    await assert.rejects(call(corrupt, 'get', 'id'), SyntaxError);
});

test('startup disconnects and fails if session index initialization fails', async () => {
    mock.method(mongoose, 'connect', async () => {});
    const disconnect = mock.method(mongoose, 'disconnect', async () => {});
    const descriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
    const originalDb = mongoose.connection.db;
    Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 1 });
    mongoose.connection.db = { collection() { return { async createIndex() { throw new Error('index denied'); } }; } };
    try {
        await assert.rejects(startServer({ config: { mongoUrl: 'unused', production: true } }), /index denied/);
        assert.equal(disconnect.mock.callCount(), 1);
    } finally {
        if (descriptor) Object.defineProperty(mongoose.connection, 'readyState', descriptor);
        else delete mongoose.connection.readyState;
        mongoose.connection.db = originalDb;
    }
});

test('logout does not report success when persistent session deletion fails', () => {
    const failure = new Error('delete failed');
    logout({ logOut(done) { done(); }, session: { destroy(done) { done(failure); } } }, {
        clearCookie() { assert.fail('must not report successful logout'); }
    }, error => assert.equal(error, failure));
});
