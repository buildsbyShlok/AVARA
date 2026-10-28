const path = require("node:path");

function loadConfig(env = process.env) {
    const production = env.NODE_ENV === "production";
    const port = Number(env.PORT || 5000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be between 1 and 65535.");
    if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
        throw new Error("SESSION_SECRET must contain at least 32 characters.");
    }
    if (production && !env.MONGO_URL) throw new Error("MONGO_URL is required in production.");
    const origins = (env.ALLOWED_ORIGINS || (production ? "" :
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173,http://localhost:3000"))
        .split(",").map(value => value.trim()).filter(Boolean);
    if (!origins.length) throw new Error("ALLOWED_ORIGINS is required in production.");
    for (const origin of origins) {
        let parsed;
        try { parsed = new URL(origin); } catch { throw new Error("ALLOWED_ORIGINS must contain valid origins."); }
        if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin || (production && parsed.protocol !== "https:")) {
            throw new Error("ALLOWED_ORIGINS must contain exact origins (HTTPS in production), without paths or wildcards.");
        }
    }
    const proxy = env.TRUST_PROXY || "0";
    if (!/^\d+$/.test(proxy) || !Number.isSafeInteger(Number(proxy))) throw new Error("TRUST_PROXY must be a nonnegative proxy hop count.");
    return {
        production, port, origins,
        mongoUrl: env.MONGO_URL || "mongodb://127.0.0.1:27017/wanderlust",
        sessionSecret: env.SESSION_SECRET,
        trustProxy: Number(proxy),
        uploadDir: path.resolve(__dirname, env.UPLOAD_DIR || "uploads"),
    };
}

module.exports = { loadConfig };
