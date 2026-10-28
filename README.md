# AVARA

AVARA is a cinematic travel platform for discovering destinations, publishing listings, writing reviews, and managing curator profiles. This README is the authoritative project and operations guide.

**Working directory:** `S:\PROJECTS\AVARA`. This is the active consolidated project, with `frontend/` and `backend/`. Earlier `S:\WEB DEV` locations are historical and are not setup paths or confirmed backups. Preserve any separate original WanderLust project; do not modify or delete it as part of AVARA work.

**Release status:** MongoDB-backed sessions are integrated and verified with real Passport login across backend restarts in an isolated test database. Production never falls back to MemoryStore. Dependency vulnerability audits were attempted on 27 October 2026 for both applications, but npm returned `ECONNRESET`; audit status remains unverified. No dependency versions were changed. Hosting/TLS configuration and the remaining [deployment checks](#deployment) still apply.

## Architecture and repository

```text
frontend/
  public/favicon.svg          AVARA monogram, derived from the existing logo
  src/
    animations/               Shared active motion variants
    components/               Navigation, listing/gallery, reviews, common UI
    context/                  Authentication and toast providers
    hooks/                    Authentication hook
    layouts/                  Shared page layout
    pages/                    Explore, listing CRUD, auth and profiles
    services/                 Same-origin JSON API client
    App.jsx                   React Router routes and loading experience
  index.html                  Metadata, favicon and external font references
  vite.config.js              Development/preview API and upload proxies
  tailwind.config.js          AVARA colors, type, spacing and motion tokens
  scripts/check-project.cjs    Read-only source/import/asset/lockfile checks
  dist/                       Generated production bundle; rebuild, do not edit
backend/
  controllers/                Auth, listings, reviews, profiles and uploads
  middleware/                 Authentication/ownership, validation and errors
  models/                     User, Listing and Review Mongoose schemas
  routes/                     Express API routers
  tests/                      Unit/regression tests and opt-in isolated session integration
  utils/                      Async route wrapper and HTTP error class
  config.js                   Validated runtime configuration
  sessionStore.js             MongoDB-backed express-session adapter
  server.js                   App factory, database startup and shutdown
  .env                        Local secrets/configuration; never commit or overwrite
  .env.example                Safe configuration template; contains no credentials
  uploads/                    User media; preserve and back up independently
package.json                  Root commands for both applications; no root dependencies
package-lock.json             Preserved root lockfile
.gitignore                    Shared dependency/build/secret/upload exclusions
```

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, React Router, Lucide and canvas-confetti. Preserve the AVARA monogram, editorial layout and palette. The `avara-*` Tailwind token replaces the old token without changing color values.
- **Backend:** Express, Node.js, MongoDB/Mongoose, Passport Local, passport-local-mongoose and express-session. The controller/route/model layout is retained.
- **Data flow:** browser services send credentialed requests to `/api`; Vite proxies `/api` and `/uploads` to `http://localhost:5000` in development and preview. Production must route these paths to Express on the same public origin.
- **Implemented:** signup/login/logout/session lookup; listing create/read/update/delete; reviews; personal/public profiles; name/bio/location/phone/avatar editing; username and password changes; local uploads, image URLs, gallery covers and lightbox; animated navigation and loading.
- **Discovery:** home search/category filters run on the fetched listing set. The listing API separately supports literal `search` and `country` filters. There is no booking, payment, itinerary or email-notification service implemented.

## Setup

Use Node.js **22.12 or newer** and npm (the verified runtime was Node 24). Keep the committed npm lockfiles. Do not replace them with another package manager's lockfile.

The relocated working copy already includes both dependency directories; no reinstall is required. From the project root, only on a fresh checkout without dependencies:

```powershell
npm ci --prefix frontend
npm ci --prefix backend
```

For the existing working copy, installed dependencies are already present. `npm ci` replaces a package's dependency directory, so do not run it merely as a cleanup operation. The root package has no dependencies and needs no install step.

Keep the existing `backend/.env`. **Only if it does not exist**, copy `backend/.env.example` to `backend/.env`, then configure values locally. Generate a unique session secret with at least 32 characters and place it in the environment file or deployment secret manager. Never paste credentials into logs, reports, screenshots or source control.

Ensure the existing MongoDB service is available. There is no seed, reset or migration command in this repository.

Run these from `S:\PROJECTS\AVARA` in two terminals. Stop a previous copy if it already occupies the same development ports; run only the selected AVARA copy when making live changes:

```powershell
npm run dev:backend
```

```powershell
npm run dev:frontend
```

Open `http://localhost:5173`. Keep the same hostname throughout a login session: `localhost` and `127.0.0.1` have separate cookies. If the API port changes, update the target in `frontend/vite.config.js` as well.

## Environment

The server loads `backend/.env` relative to its own file, independent of the shell's working directory. Environment values already supplied by the host take precedence. No server secret belongs in a Vite `VITE_*` variable; those values are public in a browser build.

| Variable | Development/default | Production requirements |
| --- | --- | --- |
| `NODE_ENV` | `development` in the template | Set to `production` with HTTPS, explicit database/origins and trusted proxy configuration. |
| `PORT` | `5000` | Integer from 1 through 65535. |
| `MONGO_URL` | `mongodb://127.0.0.1:27017/wanderlust` | Explicit URI required; retain the existing database name. Keep credentials secret. |
| `SESSION_SECRET` | No fallback; at least 32 characters required | Unique, high-entropy secret from a secret manager. Rotation invalidates signed sessions. |
| `ALLOWED_ORIGINS` | Local Vite ports 5173/4173 and localhost:3000 | Comma-separated exact HTTPS origins, without paths, trailing slash or wildcard. Include the actual public frontend origin. |
| `TRUST_PROXY` | `0` | Exact trusted reverse-proxy hop count; do not blindly trust client-supplied forwarding headers. |
| `UPLOAD_DIR` | `uploads`, relative to `backend/` | Absolute persistent-volume directory or server-relative path. Setting it does not move or copy existing files. |

Startup validates configuration before connecting. It waits for MongoDB and the session expiry index before accepting HTTP traffic and exits unsuccessfully if either initialization fails. The database role needs read/write access and permission to create the TTL index on `avara_sessions`. Connection errors are not printed because they can contain credentials. `/api/health` returns 503 when the database is unavailable. SIGINT/SIGTERM close the HTTP server and MongoDB connection, with a bounded shutdown deadline.

## Scripts and checks

Run these from the root:

| Script | Purpose |
| --- | --- |
| `npm run dev:frontend` | Vite development frontend, normally port 5173. |
| `npm run dev:backend` | Express via nodemon, normally port 5000. |
| `npm run build` | Build the frontend into `frontend/dist`; replace stale generated bundles. |
| `npm run preview` | Preview the built frontend, normally port 4173, with the configured proxies. Not a production web server. |
| `npm start` | Start the backend with Node and MongoDB-backed sessions in both development and production. |
| `npm test` | Run backend unit/regression tests; the isolated MongoDB integration test is skipped unless `AVARA_TEST_MONGOD` is set. Existing data/uploads are never used. |
| `npm run check` | Check JS/JSX syntax, undefined frontend identifiers, relative module references, declared dependencies, package/lock agreement, favicon and ignore rules. |

Equivalent direct commands when npm is not on PATH:

```powershell
node --test backend/tests/*.test.js
node frontend/scripts/check-project.cjs
```

Run the frontend build from `frontend/` with `node node_modules/vite/bin/vite.js build`. Installing dependencies still requires npm. Existing package versions and resolved dependency entries were preserved during consolidation; only first-party package metadata changed.

## Frontend routes

| Route | Purpose | Authentication |
| --- | --- | --- |
| `/` | Destination discovery | Public |
| `/listings/:id` | Details, gallery, host and reviews | Public; review writes require login |
| `/listings/new` | Publish a listing | Required |
| `/listings/:id/edit` | Edit a listing | Required; server enforces ownership |
| `/login`, `/signup` | Authentication | Public |
| `/profile` | Personal profile and account settings | Required |
| `/users/:username` | Public curator profile | Public; no email/phone returned |
| Other paths | Not-found page | Public |

## API

Requests and responses use JSON. Browser requests include cookies via `credentials: 'include'`. Errors return `{ success: false, message, error, statusCode }` through central middleware; some authorization handlers return the smaller `{ success: false, message }` shape. Invalid input is 400, unauthenticated access 401, forbidden changes/origins 403, missing resources 404, oversized bodies 413 and unexpected errors 500. Unexpected exception text is not returned to clients or written to logs.

| Method | Path | Behavior/access |
| --- | --- | --- |
| GET | `/api/health` | Readiness; 200 only while MongoDB is connected, otherwise 503. |
| GET | `/api/auth/me` | Current formatted user or `user: null`. |
| POST | `/api/auth/signup` | Register with username, email, password and optional display/profile fields. |
| POST | `/api/auth/login` | Authenticate username/password and establish a session. |
| POST | `/api/auth/logout` | End session and clear the cookie. |
| GET | `/api/listings` | Listings, optional literal `search` and `country` query parameters. |
| GET | `/api/listings/:id` | Listing, populated public host/reviews, gallery and average rating. |
| POST | `/api/listings` | Create; authenticated user becomes owner. |
| PUT | `/api/listings/:id` | Update; owner only, save hooks synchronize gallery/cover. |
| DELETE | `/api/listings/:id` | Delete; owner only, associated reviews cascade. |
| POST | `/api/listings/:id/reviews` | Create review; authenticated, nonblank comment, integer rating 1–5. |
| DELETE | `/api/listings/:id/reviews/:reviewId` | Review author only; review must belong to this listing. |
| GET | `/api/users/profile` | Personal profile, including private contact fields and hosted listings. |
| PUT | `/api/users/profile` | Update name, bio, location, phone or profilePicture. |
| PUT | `/api/users/username` | Change username, check uniqueness and update Passport session. |
| PUT | `/api/users/change-password` | Change password using `oldPassword` and `newPassword`. |
| GET | `/api/users/:username` | Public profile and listings; excludes email and phone. |
| POST | `/api/upload/listing-images` | Authenticated gallery upload/URL normalization, 1–8 images. |
| POST | `/api/upload/avatar` | Authenticated single avatar upload. |

Listings accept a direct object or `{ listing: { title, description, location, country, price, image? }, images? }`. Gallery entries are URL strings or `{ url, filename?, isCover?, _id? }` objects. Legacy single-image records continue to work. Clients cannot set ownership, reviews, timestamps or MongoDB update operators through listing payloads.

Reviews accept `{ comment, rating }` or `{ review: { comment, rating } }`. Upload endpoints use JSON/base64, not multipart. Profile fields and password values remain private to authenticated responses; public listing/review author projections omit contact data.

## MongoDB and data protection

**Keep the existing `wanderlust` database.** Its name is a data-compatibility boundary, not obsolete branding. Models continue to use the `users`, `listings` and `reviews` collections and existing ObjectId references. Password hashes/salts are managed by passport-local-mongoose. Do not reseed, drop collections, rewrite IDs, rename the database, or run destructive migrations as part of installation or testing.

Existing users, listings and reviews retain their schemas and collection names. On normal startup, the session adapter creates only the dedicated `avara_sessions` collection and its TTL index as needed. It never resets, seeds or migrates application data. Unit/regression tests mock database operations; the opt-in persistence test launches a separate local MongoDB process with a new temporary data directory and never uses the configured `MONGO_URL` or existing `wanderlust` data.

## Uploads and assets

- Keep **all five existing files** in `backend/uploads`, including byte-identical files in avatar and listing locations. Their URLs and lifecycle differ; identical bytes do not prove either file is disposable.
- `POST /api/upload/listing-images` accepts `{ images: [{ dataUrl?, url?, filename?, isCover? }] }`. Existing `/uploads/listings/<filename>` URLs survive edits. `POST /api/upload/avatar` accepts `{ dataUrl, filename? }`.
- Server uploads allow JPEG/PNG/WEBP/GIF, maximum 10 MiB per file. The gallery picker offers JPEG/PNG/WEBP. Gallery limit: eight images. The 115 MiB JSON limit accommodates base64 overhead for eight maximum-size files; align reverse-proxy limits and rate limits accordingly.
- Files are written under `UPLOAD_DIR/listings` or `UPLOAD_DIR/avatars`, served under `/uploads`. Local media storage is public, not access-controlled private storage.
- A selected gallery cover is synchronized to the legacy `image` field. The frontend preserves exactly one selected cover and rejects an empty edited gallery.
- AVARA SVG logos, the new favicon, all active UI components and external Unsplash/font references remain. The original starter icon sprite was unused and removed.
- Upload cleanup is **not automatic** when listings or avatars change. Any orphan detection/deduplication, storage move or CDN migration needs a separate reference audit, backup and explicit approval.

## Authentication and sessions

Passport Local authenticates against the existing user collection. express-session stores a session ID in the `connect.sid` cookie; the application uses a seven-day cookie, `HttpOnly`, `SameSite=Lax`, and `Secure` in production. API authorization always runs on the server; frontend route guards are only navigation controls.

Normal startup uses the MongoDB session adapter in `backend/sessionStore.js` in **both development and production**, sharing the existing Mongoose connection. No additional service, package installation or environment variable is required. It implements the [express-session store interface](https://expressjs.com/en/resources/middleware/session/#session-store-implementation) using the already-installed MongoDB driver through Mongoose; it is maintained in this repository, not an installed connect-mongo dependency.

Sessions live in the dedicated `avara_sessions` collection. Session IDs are hashed before storage; the session payload contains Passport's user identifier and cookie metadata, not a password. A TTL index removes expired records, and reads independently reject expiry immediately. Touching a session updates expiry without recreating deleted sessions. Database/index initialization failure prevents startup; runtime store errors propagate to the error handler, with no memory fallback. Logout only reports success after session deletion succeeds.

Keep `SESSION_SECRET`, the database and browser hostname stable across restarts. Existing in-memory logins cannot be recovered during the first switch; users log in once to establish a persistent session. Cookie settings remain seven days, HttpOnly, SameSite=Lax, and Secure in production. Tests can inject a store into `createApp`; production rejects MemoryStore. Development via `npm run dev:backend` still requires only the MongoDB service already used by the app.

To rerun the real persistence check on Windows with MongoDB installed:

```powershell
$env:AVARA_TEST_MONGOD = (Get-Command mongod).Source
node --test backend/tests/sessionPersistence.integration.test.js
Remove-Item Env:AVARA_TEST_MONGOD
```

This starts its own MongoDB on an ephemeral loopback port, creates a test-only account, checks real login across backend restarts, logout, expiry and production cookie flags, then stops only its own processes. The production cookie check simulates HTTPS termination through the configured trusted proxy; it does not validate a deployed TLS endpoint. The test's temporary database/log directory is retained under the OS temporary directory and reported by the test. The default `npm test` run skips this integration test unless the executable is explicitly configured.

## Deployment

Do not describe this checkout as fully production-approved until these prerequisites are complete:

1. Re-run `npm audit --prefix backend` and `npm audit --prefix frontend` when registry access works. Both returned `ECONNRESET` on 27 October 2026; no vulnerability-free claim is made and no blind upgrades were performed.
2. Choose the public domain, TLS termination and reverse-proxy topology. Configure exact HTTPS `ALLOWED_ORIGINS`, explicit `MONGO_URL`, a high-entropy secret, and the correct `TRUST_PROXY` count without overwriting the local `.env`.
3. Back up MongoDB and existing uploads. Mount persistent upload storage without replacing or clearing its contents. Multiple API instances require shared media storage and a shared session store.
4. Build the frontend, serve `frontend/dist` from a production web server, proxy `/api/*` and `/uploads/*` to Express, and send non-file frontend navigation paths to `index.html`. Never expose `backend/.env`, project source or node_modules. Vite preview is for local verification.
5. Configure request limits/timeouts and login/upload abuse controls at the ingress, plus monitoring and a process manager. Probe `/api/health` for readiness. Restart gracefully.
6. Run isolated integration tests of signup/login/logout, profile and password updates, listing/review writes, persisted sessions, and uploaded-image access over HTTPS. Never seed/reset the current database for testing.

Production approvals still needed: hosting/domain/proxy/storage choices, any secret rotation, any data migration or deletion, and final privacy/terms content. No deployment, database migration, secret rotation or upload deletion was performed.

## Verification and known product follow-ups

- Backend: 34 database-free regression/configuration/privacy/session checks pass. The opt-in real-MongoDB session integration test also passed separately, including production login across two backend restarts, logout and immediate expiry rejection.
- Source/import/asset checks cover 66 modules, including the session adapter and integration tests. The frontend production build must pass after every cleanup. A bundle-size warning is advisory; code splitting is a later optimization, not a reason to delete active pages.
- Historical relocation verification passed before the current location changed: `npm test`, `npm run check` and `npm run build`. HTTP checks additionally verified the built assets, favicon, SPA navigation, API/upload proxies, anonymous authentication responses, and all five uploaded files. No MongoDB connection was opened. The existing 539 kB JavaScript bundle warning remains.
- Prior browser smoke coverage in the verified source used mocked APIs and verified the gallery editor, listing host rendering, live review averages, fetch-error retry, AVARA logo color and mobile layout. It does not establish full persisted CRUD or authentication integration coverage.
- Review averages now derive from the current review list after add/delete, and failed review submissions retain the draft. Destination fetch failures show a retry state rather than pretending there are no results. The listing detail host link has its required icon import.
- Privacy/terms and network footer labels are still display-only. Profile ratings/verification badges contain placeholder claims. Final content or a real verification/host-rating feature needs a product decision; no unsupported legal policies or verification system was invented during cleanup.
- Dependency vulnerability checks remain unverified due to registry connectivity. Existing dependency versions were retained, not silently upgraded or pruned.

## Current location and preservation

The active project is `S:\PROJECTS\AVARA`. Use this root for all setup and commands. The earlier `S:\WEB DEV\AVARA` and `S:\WEB DEV\WanderLust-React` locations were absent during the latest inspection; this README does not claim that they remain available as fallbacks. The current frontend/backend contents supersede the earlier description of this path as an older EJS-only copy.

The frontend/backend structure, AVARA design, application features, installed dependencies and lockfiles are retained. The root checker command uses `frontend/scripts/check-project.cjs`; `backend/server.js` remains the backend entry point. API/upload URLs and the Vite localhost:5000 proxy targets are independent of the project's absolute location.

The focused session change adds the local MongoDB adapter and tests, wires it into startup, and propagates logout deletion failures. No dependency versions, private `backend/.env`, uploads or user-data models were changed. Verification used an isolated temporary MongoDB process, not the existing database. Do not modify or delete a separate original WanderLust project, reset the `wanderlust` database, or remove uploads as part of setup or testing.
