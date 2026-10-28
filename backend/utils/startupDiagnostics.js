// Only sanitized strings leave this module; never log an Error or driver metadata directly.
function redact(text, config = {}, env = process.env) {
    const values = new Set();
    const add = value => {
        if (typeof value !== "string" || !value) return;
        values.add(value);
        values.add(encodeURIComponent(value));
        values.add(JSON.stringify(value).slice(1, -1));
    };
    for (const [key, value] of Object.entries(env)) {
        if (/secret|password|passwd|token|credential|api_?key|mongo_?url|database_?url/i.test(key)) add(value);
    }
    add(config.sessionSecret);
    add(config.mongoUrl);
    for (const uri of [config.mongoUrl, env.MONGO_URL, env.DATABASE_URL]) {
        if (typeof uri !== "string") continue;
        const credentials = uri.match(/^[a-z][a-z\d+.-]*:\/\/([^/?#]*)@/i)?.[1];
        if (!credentials) continue;
        const separator = credentials.indexOf(":");
        for (const value of [credentials.slice(0, separator < 0 ? undefined : separator),
            ...(separator < 0 ? [] : [credentials.slice(separator + 1)])]) {
            add(value);
            try { add(decodeURIComponent(value)); } catch { /* Invalid URIs still get redacted below. */ }
        }
    }
    let safe = typeof text === "string" ? text : "Unavailable";
    for (const value of [...values].sort((a, b) => b.length - a.length)) {
        safe = safe.split(value).join("[REDACTED]");
    }
    return safe
        .replace(/mongodb(?:\+srv)?:\/\/[^\s'"<>]+/gi, "[REDACTED_URI]")
        .replace(/[a-z][a-z\d+.-]*:\/\/[^\s/'"<>]*@[^\s'"<>]*/gi, "[REDACTED_URI]")
        .replace(/\b((?:mongo_?url|database_?url|session_?secret|password|passwd|pwd|username|user|token|api_?key|credentials?)\s*["']?\s*[:=]\s*)(?:"[^"\n]*"|'[^'\n]*'|[^\s,;}]+)/gi, "$1[REDACTED]")
        .replace(/\b(Bearer|Basic)\s+[^\s'",;]+/gi, "$1 [REDACTED]");
}

function logStartupFailure(stage, error, config) {
    const message = redact(typeof error === "string" ? error : error?.message, config);
    console.error(`AVARA startup failed [${stage}]`, JSON.stringify({
        name: redact(error?.name || "Error", config),
        message,
        stack: redact(error?.stack || "Stack unavailable", config)
    }));
}

module.exports = { redact, logStartupFailure };
