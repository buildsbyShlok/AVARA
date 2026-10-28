const { test, mock, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const { startServer } = require('../server');
const { redact, logStartupFailure } = require('../utils/startupDiagnostics');

afterEach(() => mock.restoreAll());
const config = () => ({ production: true, port: 5000, trustProxy: 1,
    origins: ['https://avara.example'], uploadDir: path.resolve(__dirname, '../uploads'),
    mongoUrl: 'mongodb+srv://diagnostic-user:p%40ssword@db.example/wanderlust',
    sessionSecret: 'diagnostic-session-secret-32-characters' });
function logs() {
    const output = [];
    mock.method(console, 'error', (...args) => output.push(args.join(' ')));
    mock.method(console, 'log', (...args) => output.push(args.join(' ')));
    return output;
}
function connectedDatabase(t, createIndex = async () => {}) {
    const descriptor = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
    const db = mongoose.connection.db;
    Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 1 });
    mongoose.connection.db = { collection() { return { createIndex }; } };
    t.after(() => {
        if (descriptor) Object.defineProperty(mongoose.connection, 'readyState', descriptor);
        else delete mongoose.connection.readyState;
        mongoose.connection.db = db;
    });
    mock.method(mongoose, 'connect', async () => {});
    return mock.method(mongoose, 'disconnect', async () => {});
}

test('redacts configured, encoded and decoded credentials in every error field', () => {
    const output = logs();
    const settings = config();
    const sensitive = [settings.mongoUrl, settings.sessionSecret, 'diagnostic-user', 'p%40ssword', 'p@ssword'];
    const error = new Error('Authentication failed: ' + sensitive.join(' '));
    error.name = 'MongoError ' + settings.sessionSecret;
    error.stack += '\n    at connect (/app/backend/server.js:123:4) ' + sensitive.join(' ');
    error.reason = { credentials: 'do-not-serialize-driver-metadata' };
    logStartupFailure('mongodb', error, settings);
    const text = output.join('\n');
    for (const value of [...sensitive, 'do-not-serialize-driver-metadata']) assert.ok(!text.includes(value));
    assert.ok(text.includes('Authentication failed'));
    assert.ok(text.includes('/app/backend/server.js:123:4'));
    assert.ok(text.includes('"name"') && text.includes('"message"') && text.includes('"stack"'));
});

test('redacts unknown URI credentials, password fields and authorization tokens', () => {
    const source = 'mongodb://foreign:unknown@host/db https://remote:pass@host/path ' +
        'password="two word password" {"sessionSecret":"other-secret"} token=abc123 Bearer token-value';
    const safe = redact(source, {}, {});
    for (const secret of ['foreign', 'unknown@', 'remote:pass', 'two word password', 'other-secret', 'abc123', 'token-value']) {
        assert.ok(!safe.includes(secret), secret);
    }
    assert.equal(redact('SESSION_SECRET must contain at least 32 characters.', {}, {}),
        'SESSION_SECRET must contain at least 32 characters.');
});

test('environment values are sanitized even before configuration validation succeeds', () => {
    const safe = redact('value=private-api-value SESSION_SECRET=short-secret', {}, {
        API_KEY: 'private-api-value', SESSION_SECRET: 'short-secret'
    });
    assert.ok(!safe.includes('private-api-value') && !safe.includes('short-secret'));
});

test('MongoDB failure identifies the stage, cleans up and preserves the original error', async () => {
    const output = logs();
    const failure = new Error('Authentication failed for ' + config().mongoUrl);
    mock.method(mongoose, 'connect', async () => { throw failure; });
    const cleanup = mock.method(mongoose, 'disconnect', async () => {});
    await assert.rejects(startServer({ config: config() }), error => error === failure);
    assert.equal(cleanup.mock.callCount(), 1);
    assert.ok(output.some(line => line.includes('startup failed [mongodb]')));
    assert.ok(!output.some(line => line.includes('[session-store]')));
    assert.ok(!output.join('\n').includes(config().mongoUrl));
});

test('cleanup failure is sanitized without replacing the original startup error', async () => {
    const output = logs();
    const failure = new Error('original connection failure');
    mock.method(mongoose, 'connect', async () => { throw failure; });
    mock.method(mongoose, 'disconnect', async () => { throw new Error('cleanup ' + config().sessionSecret); });
    await assert.rejects(startServer({ config: config() }), error => error === failure);
    assert.ok(output.some(line => line.includes('startup failed [mongodb-cleanup]')));
    assert.ok(!output.join('\n').includes(config().sessionSecret));
});

test('session index failure identifies the stage and never opens HTTP', async t => {
    const output = logs();
    const failure = new Error('not authorized to create TTL index');
    const cleanup = connectedDatabase(t, async () => { throw failure; });
    const listen = mock.method(express.application, 'listen', () => assert.fail('HTTP must not start'));
    await assert.rejects(startServer({ config: config() }), error => error === failure);
    assert.equal(cleanup.mock.callCount(), 1);
    assert.equal(listen.mock.callCount(), 0);
    assert.ok(output.some(line => line.includes('[mongodb]: connected')));
    assert.ok(output.some(line => line.includes('startup failed [session-store]')));
});

test('HTTP bind failure identifies the stage and closes the database', async t => {
    const output = logs();
    const cleanup = connectedDatabase(t);
    const failure = Object.assign(new Error('listen EADDRINUSE: address already in use'), { code: 'EADDRINUSE' });
    mock.method(express.application, 'listen', () => {
        const listener = new EventEmitter();
        queueMicrotask(() => listener.emit('error', failure));
        return listener;
    });
    await assert.rejects(startServer({ config: config() }), error => error === failure);
    assert.equal(cleanup.mock.callCount(), 1);
    assert.ok(output.some(line => line.includes('[session-store]: ready')));
    assert.ok(output.some(line => line.includes('startup failed [http]') && line.includes('EADDRINUSE')));
});

test('production MemoryStore still fails before any database connection', async () => {
    const output = logs();
    const connect = mock.method(mongoose, 'connect', async () => assert.fail('must not connect'));
    mock.method(mongoose, 'disconnect', async () => {});
    await assert.rejects(startServer({ config: config(), sessionStore: new session.MemoryStore() }), /persistent session store/);
    assert.equal(connect.mock.callCount(), 0);
    assert.ok(output.some(line => line.includes('startup failed [configuration]')));
});

test('CLI configuration failure prints sanitized diagnostics once and exits 1', () => {
    const result = spawnSync(process.execPath, [path.resolve(__dirname, '../server.js')], {
        env: { ...process.env, NODE_ENV: 'production', SESSION_SECRET: 'too-short',
            MONGO_URL: config().mongoUrl, ALLOWED_ORIGINS: 'https://avara.example' },
        encoding: 'utf8', timeout: 10000, windowsHide: true
    });
    assert.equal(result.status, 1);
    assert.equal((result.stderr.match(/startup failed/g) || []).length, 1);
    assert.ok(result.stderr.includes('[configuration]'));
    assert.ok(result.stderr.includes('SESSION_SECRET must contain at least 32 characters'));
    assert.ok(result.stderr.includes('config.js:'));
    assert.ok(!result.stderr.includes('too-short') && !result.stderr.includes(config().mongoUrl));
});
