const { test, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const session = require('express-session');
const { loadConfig } = require('../config');
const { createApp } = require('../server');
const User = require('../models/User');
const Listing = require('../models/Listing');
const users = require('../controllers/userController');
const errorHandler = require('../middleware/errorHandler');

mongoose.set('bufferCommands', false);
afterEach(() => mock.restoreAll());
const dev = () => ({ SESSION_SECRET: 'test-only-random-session-key-32-characters', NODE_ENV: 'development' });
const production = () => ({ ...dev(), NODE_ENV: 'production', MONGO_URL: 'mongodb://127.0.0.1:27017/wanderlust', ALLOWED_ORIGINS: 'https://avara.example' });
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test('configuration preserves the existing database and supports local dev/preview', () => {
    const config = loadConfig(dev());
    assert.equal(config.mongoUrl, 'mongodb://127.0.0.1:27017/wanderlust');
    assert.equal(config.trustProxy, 0);
    assert.ok(config.origins.includes('http://localhost:5173'));
    assert.ok(config.origins.includes('http://localhost:4173'));
});

test('configuration rejects missing secrets, bad ports and ambiguous proxy trust', () => {
    for (const env of [{}, { ...dev(), SESSION_SECRET: 'short' }, { ...dev(), PORT: '-1' }, { ...dev(), PORT: 'NaN' }, { ...dev(), TRUST_PROXY: 'true' }]) {
        assert.throws(() => loadConfig(env));
    }
});

test('production requires explicit database and exact HTTPS origins', () => {
    for (const env of [
        { ...production(), MONGO_URL: '' }, { ...production(), ALLOWED_ORIGINS: '' },
        { ...production(), ALLOWED_ORIGINS: '*' }, { ...production(), ALLOWED_ORIGINS: 'https://avara.example/path' },
        { ...production(), ALLOWED_ORIGINS: 'http://avara.example' }
    ]) assert.throws(() => loadConfig(env));
    assert.equal(loadConfig(production()).production, true);
});

test('production refuses the implicit in-memory session store', () => {
    assert.throws(() => createApp({ config: loadConfig(production()) }), /persistent session store/);
    assert.throws(() => createApp({ config: loadConfig(production()), sessionStore: new session.MemoryStore() }), /persistent session store/);
});

test('app imports and creation do not connect to MongoDB', () => {
    const connect = mock.method(mongoose, 'connect', () => assert.fail('Tests must not connect'));
    createApp({ config: loadConfig(dev()), sessionStore: new session.MemoryStore() });
    assert.equal(connect.mock.callCount(), 0);
});

test('public profiles omit email and phone; personal profiles keep both', async () => {
    const user = { _id: new mongoose.Types.ObjectId(), username: 'curator', email: 'private@example.test', phone: 'private-contact', name: 'Curator' };
    mock.method(User, 'findOne', async () => user);
    mock.method(User, 'findById', async () => user);
    mock.method(Listing, 'find', () => ({ sort: async () => [] }));
    const publicResult = response(), personalResult = response();
    await users.getUserProfile({ params: { username: user.username } }, publicResult);
    await users.getMyProfile({ user }, personalResult);
    assert.equal(Object.hasOwn(publicResult.body.profile, 'email'), false);
    assert.equal(Object.hasOwn(publicResult.body.profile, 'phone'), false);
    assert.equal(personalResult.body.profile.email, user.email);
    assert.equal(personalResult.body.profile.phone, user.phone);
    assert.equal(publicResult.body.profile.username, user.username);
});

test('server errors do not echo sensitive exception text', () => {
    const log = mock.method(console, 'error', () => {});
    const res = response();
    errorHandler(new Error('sensitive-database-connection-detail'), {}, res, () => {});
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Internal Server Error');
    assert.ok(!JSON.stringify(log.mock.calls).includes('sensitive-database-connection-detail'));
});

test('body parser errors retain their client status', () => {
    const res = response();
    errorHandler({ status: 413, message: 'request entity too large' }, {}, res, () => {});
    assert.equal(res.statusCode, 413);
});

test('HTTP origins, readiness and route boundaries work without a database', async t => {
    const app = createApp({ config: loadConfig(dev()), sessionStore: new session.MemoryStore() });
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
    const base = `http://127.0.0.1:${server.address().port}`;
    const allowed = await fetch(base + '/api/auth/me', { headers: { Origin: 'http://localhost:5173' } });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    assert.equal((await allowed.json()).user, null);
    const blocked = await fetch(base + '/api/auth/me', { headers: { Origin: 'https://unknown.example' } });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.headers.get('access-control-allow-origin'), null);
    assert.equal((await fetch(base + '/api/health')).status, 503);
    assert.equal((await fetch(base + '/api/unknown')).status, 404);
    assert.equal((await fetch(base + '/api/users/profile')).status, 401);
    assert.equal((await fetch(base + '/api/upload/avatar', { method: 'POST' })).status, 401);
    assert.equal((await fetch(base + '/api/upload/listing-images', { method: 'POST' })).status, 401);
    assert.equal((await fetch(base + '/uploads/.env')).status, 404);
});
