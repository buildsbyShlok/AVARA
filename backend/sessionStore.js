const { Store } = require("express-session");
const { createHash } = require("node:crypto");

const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// Uses the existing MongoDB connection; never opens a connection or falls back to memory.
class MongoSessionStore extends Store {
    constructor(collection) {
        super();
        this.collection = collection;
    }

    async initialize() {
        await this.collection.createIndex({ expires: 1 }, {
            name: "avara_session_expiry", expireAfterSeconds: 0
        });
        return this;
    }

    key(sid) {
        return createHash("sha256").update(sid).digest("hex");
    }

    expiry(session) {
        const expires = session.cookie?.expires
            ? new Date(session.cookie.expires) : new Date(Date.now() + SESSION_MAX_AGE);
        if (!Number.isFinite(expires.getTime())) throw new Error("Invalid session expiry.");
        return expires;
    }

    run(operation, callback = () => {}) {
        Promise.resolve().then(operation).then(value => callback(null, value), callback);
    }

    get(sid, callback) {
        this.run(async () => {
            // TTL deletion is asynchronous; expired records must be rejected immediately.
            const record = await this.collection.findOne({
                _id: this.key(sid), expires: { $gt: new Date() }
            });
            return record ? JSON.parse(record.session) : null;
        }, callback);
    }

    set(sid, session, callback) {
        this.run(async () => {
            await this.collection.updateOne({ _id: this.key(sid) }, {
                $set: { session: JSON.stringify(session), expires: this.expiry(session) }
            }, { upsert: true });
        }, callback);
    }

    touch(sid, session, callback) {
        this.run(async () => {
            // Never recreate a logged-out or expired session on a concurrent read.
            await this.collection.updateOne({
                _id: this.key(sid), expires: { $gt: new Date() }
            }, { $set: { expires: this.expiry(session) } });
        }, callback);
    }

    destroy(sid, callback) {
        this.run(async () => {
            await this.collection.deleteOne({ _id: this.key(sid) });
        }, callback);
    }
}

async function createMongoSessionStore(connection) {
    if (connection.readyState !== 1 || !connection.db) {
        throw new Error("A connected MongoDB instance is required for sessions.");
    }
    return new MongoSessionStore(connection.db.collection("avara_sessions")).initialize();
}

module.exports = { MongoSessionStore, createMongoSessionStore, SESSION_MAX_AGE };
