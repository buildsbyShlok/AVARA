require("dotenv").config({ path: require("node:path").join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const listingRoutes = require("./routes/listingRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const errorHandler = require("./middleware/errorHandler");
const { loadConfig } = require("./config");
const ExpressError = require("./utils/ExpressError");
const { createMongoSessionStore, SESSION_MAX_AGE } = require("./sessionStore");
const { logStartupFailure } = require("./utils/startupDiagnostics");

function createApp({ config = loadConfig(), sessionStore } = {}) {
    if (config.production && (!sessionStore || sessionStore instanceof session.MemoryStore)) {
        throw new Error("Production requires a persistent session store. See README deployment prerequisites.");
    }
    const app = express();
    app.disable("x-powered-by");
    app.set("trust proxy", config.trustProxy);

    // CORS Configuration
    const allowedOrigins = config.origins;

    app.use(cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new ExpressError(403, "Origin not allowed."));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    }));

    // Body & Cookie Parsers with increased limit for base64 uploads
    app.use(express.json({ limit: "115mb" }));
    app.use(express.urlencoded({ extended: true, limit: "50mb" }));
    app.use(cookieParser());

    // Static Uploads Serving
    app.use("/uploads", express.static(config.uploadDir, {
        dotfiles: "deny",
        setHeaders(res) { res.setHeader("X-Content-Type-Options", "nosniff"); }
    }));

    // Session Configuration
    const sessionOptions = {
        secret: config.sessionSecret,
        ...(sessionStore ? { store: sessionStore } : {}),
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: SESSION_MAX_AGE,
            httpOnly: true,
            sameSite: "lax",
            secure: config.production
        }
    };

    app.use(session(sessionOptions));

    // Passport Authentication Configuration
    app.use(passport.initialize());
    app.use(passport.session());
    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    // Health Check Endpoint
    app.get("/api/health", (req, res) => {
        const ready = mongoose.connection.readyState === 1;
        res.status(ready ? 200 : 503).json({
            status: ready ? "healthy" : "unavailable",
            product: "AVARA API",
            version: require("./package.json").version,
            timestamp: new Date().toISOString()
        });
    });

    // API Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/listings", listingRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/upload", uploadRoutes);

    // 404 Handler for Unknown API Endpoints
    app.all("/api/*", (req, res) => {
        res.status(404).json({
            success: false,
            message: `API route not found: ${req.method} ${req.originalUrl}`
        });
    });

    // Root fallback
    app.get("/", (req, res) => {
        res.send("AVARA Cinematic Travel OS API Server is operational.");
    });

    // Centralized Error Handling Middleware
    app.use(errorHandler);

    return app;
}

async function startServer(options = {}) {
    let config;
    let stage = "configuration";
    let server;
    try {
        console.log("AVARA startup [configuration]: validating");
        config = options.config || loadConfig();
        if (config.production && options.sessionStore instanceof session.MemoryStore) {
            throw new Error("Production requires a persistent session store.");
        }
        stage = "mongodb";
        console.log("AVARA startup [mongodb]: connecting");
        await mongoose.connect(config.mongoUrl, { serverSelectionTimeoutMS: 10000 });
        console.log("AVARA startup [mongodb]: connected");
        stage = "session-store";
        console.log("AVARA startup [session-store]: initializing persistent store");
        const sessionStore = options.sessionStore || await createMongoSessionStore(mongoose.connection);
        console.log("AVARA startup [session-store]: ready");
        stage = "application";
        const app = createApp({ ...options, config, sessionStore });
        stage = "http";
        console.log("AVARA startup [http]: starting listener");
        server = await new Promise((resolve, reject) => {
            const listener = app.listen(config.port, () => resolve(listener));
            listener.once("error", reject);
        });
    } catch (error) {
        logStartupFailure(stage, error, config);
        try {
            await mongoose.disconnect();
        } catch (cleanupError) {
            logStartupFailure("mongodb-cleanup", cleanupError, config);
        }
        throw error;
    }
    console.log(`AVARA API listening on port ${config.port}`);
    const shutdown = () => {
        const deadline = setTimeout(() => process.exit(1), 10000);
        deadline.unref();
        server.close(async () => {
            await mongoose.disconnect();
            clearTimeout(deadline);
            process.exit(0);
        });
    };
    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
    return server;
}

if (require.main === module) {
    startServer().catch(() => {
        // startServer has already logged sanitized diagnostics and attempted cleanup.
        process.exitCode = 1;
    });
}

module.exports = { createApp, startServer };
