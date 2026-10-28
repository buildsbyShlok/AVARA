const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { mkdtemp } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { randomBytes } = require('node:crypto');
const mongoose = require('mongoose');

async function freePort() {
    const server = net.createServer().listen(0, '127.0.0.1');
    await once(server, 'listening');
    const port = server.address().port;
    await new Promise(resolve => server.close(resolve));
    return port;
}
async function stop(child) {
    if (!child || child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, 'exit');
    child.kill();
    await exited;
}
async function until(check) {
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
        try { if (await check()) return; } catch {}
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Isolated integration service did not become ready');
}

test('real Passport login survives backend restart; logout and expiry revoke it', {
    skip: !process.env.AVARA_TEST_MONGOD && 'Set AVARA_TEST_MONGOD to a local mongod executable for isolated integration',
    timeout: 90000
}, async t => {
    // Never uses backend/.env or a supplied MongoDB URI. All writes use a new local mongod.
    const directory = await mkdtemp(path.join(tmpdir(), 'avara-session-test-'));
    const mongoPort = await freePort();
    const mongo = spawn(process.env.AVARA_TEST_MONGOD, [
        '--dbpath', directory, '--bind_ip', '127.0.0.1', '--port', String(mongoPort),
        '--logpath', path.join(directory, 'mongod.log')
    ], { windowsHide: true, stdio: 'ignore' });
    let backend, client;
    let mongoError;
    mongo.on('error', error => { mongoError = error; });
    t.after(async () => { await stop(backend); if (client) await client.close(); await stop(mongo); });
    const mongoUrl = `mongodb://127.0.0.1:${mongoPort}/avara_session_test`;
    await until(async () => {
        if (mongoError || mongo.exitCode !== null) throw new Error('Isolated MongoDB did not start');
        const candidate = new mongoose.mongo.MongoClient(mongoUrl, { serverSelectionTimeoutMS: 200 });
        try { await candidate.connect(); client = candidate; return true; }
        catch { await candidate.close(); return false; }
    });
    const apiPort = await freePort();
    const env = { ...process.env, MONGO_URL: mongoUrl, NODE_ENV: 'production', PORT: String(apiPort),
        SESSION_SECRET: randomBytes(48).toString('hex'), ALLOWED_ORIGINS: 'https://avara.test', TRUST_PROXY: '1' };
    const base = `http://127.0.0.1:${apiPort}`;
    async function start() {
        backend = spawn(process.execPath, [path.resolve(__dirname, '../server.js')], {
            env, windowsHide: true, stdio: 'ignore'
        });
        await until(async () => (await fetch(base + '/api/health', { signal: AbortSignal.timeout(1000) })).status === 200);
    }
    async function request(route, cookie, body) {
        return fetch(base + route, {
            method: body ? 'POST' : 'GET',
            headers: { 'Content-Type': 'application/json', 'X-Forwarded-Proto': 'https',
                Origin: 'https://avara.test', ...(cookie ? { Cookie: cookie } : {}) },
            ...(body ? { body: JSON.stringify(body) } : {})
        });
    }
    const credentials = { username: 'restart_check', password: randomBytes(24).toString('hex') };
    await start();
    assert.equal((await request('/api/auth/signup', null, { ...credentials, email: 'restart@example.test' })).status, 201);
    const login = await request('/api/auth/login', null, credentials);
    assert.equal(login.status, 200);
    const setCookie = login.headers.get('set-cookie');
    for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax']) assert.ok(setCookie.includes(flag));
    const cookie = setCookie.split(';')[0];
    const sessions = client.db().collection('avara_sessions');
    const indexes = await sessions.indexes();
    assert.equal(indexes.find(index => index.name === 'avara_session_expiry').expireAfterSeconds, 0);
    await stop(backend);
    await start();
    const restored = await request('/api/auth/me', cookie);
    assert.equal((await restored.json()).user.username, credentials.username);
    const logout = await request('/api/auth/logout', cookie, {});
    assert.equal(logout.status, 200);
    await stop(backend);
    await start();
    assert.equal((await (await request('/api/auth/me', cookie)).json()).user, null);
    const nextLogin = await request('/api/auth/login', null, credentials);
    const expiringCookie = nextLogin.headers.get('set-cookie').split(';')[0];
    // Only this isolated test database is modified to simulate expiry before TTL cleanup.
    await sessions.updateMany({}, { $set: { expires: new Date(0) } });
    assert.equal((await (await request('/api/auth/me', expiringCookie)).json()).user, null);
    assert.equal(await client.db().collection('users').countDocuments(), 1);
    t.diagnostic('Production cookie flags, real login, two backend restarts, logout and expiry passed against isolated MongoDB.');
    t.diagnostic('Temporary test database retained at ' + directory);
});
