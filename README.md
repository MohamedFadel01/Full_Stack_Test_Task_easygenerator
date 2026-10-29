# Full Stack Test Task (Easygenerator)

Production-oriented authentication module: **NestJS 12** API with **MongoDB**, **React 19** SPA, JWT Bearer sessions, automated tests, Docker Compose, Swagger, and GitHub Actions CI.

## Implemented features

| Area | Delivered |
|------|-----------|
| **Sign-up** | `POST /api/auth/sign-up` — creates **unverified** user, sends verification email; **201** with `user` + `message` (no JWT) |
| **Email verify** | `POST /api/auth/verify-email`, `POST /api/auth/resend-verification`; link opens `/verify-email?token=…` on the SPA |
| **Sign-in** | `POST /api/auth/sign-in` after verification; **403** `EMAIL_NOT_VERIFIED` if pending |
| **Session refresh / logout** | `POST /api/auth/refresh` (httpOnly cookie), `POST /api/auth/logout` (revokes refresh, bumps `tokenVersion`) |
| **Protected API** | `GET /api/auth/me` (Bearer access JWT with `typ` + `ver` claims) |
| **Health** | `GET /api/health` — **200** when Mongo is connected, **503** when not |
| **Frontend** | `/sign-up`, `/check-email`, `/verify-email`, `/sign-in`, protected `/app`; server logout |
| **Session** | Access JWT in **memory**; refresh in **httpOnly** cookie; reload restores via `/auth/refresh` |
| **Hardening** | Helmet (CSP, HSTS in production), rate limiting, CORS with credentials, [`docs/M09-auth-hardening.md`](docs/M09-auth-hardening.md) |
| **Logging** | HTTP access lines on the backend (`HTTP` logger); MongoDB operations logged via backend `MongoDB` logger (not health probes) |
| **DX** | Multi-stage Dockerfiles, root Compose (Mongo + API + nginx SPA), Swagger at `/api/docs`, CI workflow |

Interactive API docs: **http://localhost:3000/api/docs** (when the backend is running).

## Technology stack

| Layer | Choices |
|-------|---------|
| Frontend | React 19, TypeScript, Vite 8, React Router 7, React Hook Form, Zod, Tailwind CSS 4, shadcn/ui |
| Backend | NestJS 12, Mongoose 8, Passport JWT, class-validator, bcrypt, `@nestjs/throttler`, `@nestjs/swagger` |
| Database | MongoDB 7 |
| Testing | Vitest (unit + backend e2e), Testing Library (frontend unit), Playwright (browser e2e), mongodb-memory-server |
| Tooling | Prettier, oxlint (with type-aware lint on backend) |
| Delivery | Docker Compose, GitHub Actions (`ubuntu-latest`, Node 20) |

## Architecture (high level)

```text
Browser ──► React SPA (Vite dev :5173 or nginx :8080 in Compose)
              │  Authorization: Bearer <access JWT> (in-memory) + refresh cookie
              ▼
         NestJS /api/*  ──►  Mongoose  ──►  MongoDB
              │
              ├── Auth: RegisterUserUseCase, SignInUseCase, GetCurrentUserUseCase
              └── Users: repository abstraction + Mongoose implementation
```

- Global API prefix: **`/api`** ([`configure-http-app.ts`](backend/src/configure-http-app.ts)).
- Auth routes use **kebab-case** paths: `/api/auth/sign-up`, `/api/auth/sign-in` (not `/auth/signup` from some prompt examples).
- Compose serves the frontend as **static files**; the browser calls the API on **host port 3000** (`VITE_API_URL` baked at image build time).

## Prerequisites

- **Node.js 20 LTS** (or newer; CI uses 20)
- **npm**
- **MongoDB** for local backend development (or use Docker — see below)
- **Docker** and **Docker Compose** (optional, for full-stack container run)
- **Playwright browsers** for frontend e2e: `cd frontend && npx playwright install chromium` (CI installs with `--with-deps`)

Automated tests use **mongodb-memory-server** and do **not** require your dev MongoDB instance.

## Local development setup

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env: set JWT_SECRET and MONGODB_URI

cd backend && npm ci && npm run start:dev

# Frontend (separate terminal)
cp frontend/.env.example frontend/.env
cd frontend && npm ci && npm run dev
```

| Service | URL (default) |
|---------|----------------|
| Frontend (Vite) | http://localhost:5173 |
| Backend API | http://localhost:3000/api |
| Health | http://localhost:3000/api/health |
| Swagger UI | http://localhost:3000/api/docs |

### Running MongoDB locally

**Option A — Docker (single container):**

```bash
docker run -d --name easygenerator-mongo -p 27017:27017 mongo:7
```

Set in `backend/.env`:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/easygenerator_auth
```

**Option B — Docker Compose (app + Mongo):** see [Docker Compose](#docker-compose).

## Environment variables

### Backend (`backend/.env`)

Copy from [`backend/.env.example`](backend/.env.example).

| Variable | Required | Default / notes |
|----------|----------|-----------------|
| `MONGODB_URI` | Yes | Local: `mongodb://127.0.0.1:27017/easygenerator_auth`. Compose: `mongodb://mongo:27017/...` (see root `.env.example`) |
| `JWT_SECRET` | Yes | Strong secret; never commit real values |
| `PORT` | No | `3000` |
| `CORS_ORIGIN` | No | Vite dev: `http://localhost:5173`. Compose: `http://localhost:8080` |
| `JWT_EXPIRES_IN` | No | Legacy alias; prefer `JWT_ACCESS_EXPIRES_IN` (`15m`) |
| `JWT_ACCESS_EXPIRES_IN` | No | Short-lived access JWT |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh cookie lifetime (`7d`) |
| `REFRESH_COOKIE_NAME` | No | Default `refresh_token` |
| `COOKIE_SECURE` / `COOKIE_SAME_SITE` | No | Dev: `false` / `lax`; enable `Secure` behind HTTPS in prod |
| `FRONTEND_URL` | No | Verification link base (Compose: `http://localhost:8080`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | No | Compose uses **Mailpit** (`mailpit:1025`); empty `SMTP_HOST` captures mail in tests |
| `THROTTLE_LIMIT` | No | `100` requests per window |
| `THROTTLE_TTL_MS` | No | `60000` (window length in ms) |

Validated at startup via [`env.validation.ts`](backend/src/config/env.validation.ts). Missing required values fail fast.

### Frontend (`frontend/.env`)

| Variable | Required | Notes |
|----------|----------|--------|
| `VITE_API_URL` | Yes (for real API) | Dev default in example: `http://localhost:3000/api` |

### Docker Compose (repository root)

Copy [`.env.example`](.env.example) to `.env` and set `JWT_SECRET`. Compose passes variables to the backend service; `VITE_API_URL` is a **build arg** for the frontend image.

```bash
cp .env.example .env
docker compose up --build
```

| URL | Purpose |
|-----|---------|
| http://localhost:8080 | Frontend (nginx) |
| http://localhost:3000/api | API |
| http://localhost:3000/api/docs | Swagger |
| http://localhost:3000/api/health | Health (+ DB readiness) |
| http://localhost:8025 | Mailpit UI (verification emails in Compose) |

## Docker Compose

[`docker-compose.yml`](docker-compose.yml) defines:

- **mailpit** — SMTP capture for dev (`8025` UI, `1025` SMTP)
- **mongo** — `mongo:7`, named volume `mongo_data`, TCP healthcheck
- **backend** — builds [`backend/Dockerfile`](backend/Dockerfile); port `3000`; waits for healthy Mongo; healthcheck hits `/api/health`
- **frontend** — builds [`frontend/Dockerfile`](frontend/Dockerfile) with `VITE_API_URL`; nginx SPA on port `8080`; waits for healthy backend

Runtime secrets come from `.env` only (not baked into images).

## Testing

### Backend

| Kind | Command | Location / notes |
|------|---------|------------------|
| Unit | `cd backend && npm test` | `**/*.spec.ts` under `src/` (Vitest) |
| API e2e / integration | `cd backend && npm run test:e2e` | `test/**/*.e2e-spec.ts`; in-memory Mongo |
| Live server (Playwright) | `cd backend && npm run start:e2e-live` | Builds `dist/`, Mongo memory server, runs `node dist/main.js` |

E2e suites include sign-up, sign-in, `/auth/me`, throttling, integration flows, health (including **503** when DB disconnected in a focused test), and OpenAPI smoke.

### Frontend

| Kind | Command | Notes |
|------|---------|--------|
| Unit / component | `cd frontend && npm test` | Vitest + Testing Library; API mocked |
| Browser e2e | `cd frontend && npm run test:e2e` | Playwright; starts backend live server + Vite preview with `/api` proxy |

Install Chromium once: `cd frontend && npx playwright install chromium`

### Full local verification (matches CI closely)

```bash
cd backend && npm ci && npm run format:check && npm run lint && npm run typecheck && npm test && npm run test:e2e

cd frontend && npm ci && npm run format:check && npm run lint && npm run typecheck && npm test
cd frontend && npx playwright install --with-deps chromium && npm run test:e2e
cd frontend && npm run build
```

**CI** (`.github/workflows/ci.yml`) runs the same backend and frontend checks plus Playwright; it does **not** run `frontend` production build or Docker Compose. Compose Mongo is for **local/runtime** verification only.

**Latest verified counts (2026-10-29):** backend **26** unit + **35** e2e; frontend **32** unit + **3** Playwright.

## Linting and type checking

| Package | Format check | Format write | Lint | Typecheck |
|---------|--------------|--------------|------|-----------|
| `backend/` | `npm run format:check` | `npm run format` | `npm run lint` | `npm run typecheck` |
| `frontend/` | `npm run format:check` | `npm run format` | `npm run lint` | `npm run typecheck` |

Linting uses **oxlint** (not ESLint). Backend lint is type-aware (`oxlint --type-aware`).

## API reference

Base URL: `{origin}/api` (e.g. `http://localhost:3000/api`).

### `GET /health`

- **200** `{ "status": "ok", "database": "up" }` when Mongoose `readyState === 1`
- **503** `{ "status": "degraded", "database": "down" }` otherwise
- Not rate-limited

### `POST /auth/sign-up`

**Body:** `{ "email", "name", "password" }`

| Rule | Detail |
|------|--------|
| Email | Valid email; trimmed before validation |
| Name | Min 3 characters; trimmed |
| Password | Min 8 chars; ≥1 letter, ≥1 number, ≥1 special; **not** trimmed |

**Responses:**

- **201** `{ "user": SafeUser, "accessToken": string }`
- **400** validation errors
- **409** duplicate email (`"Email already registered"`)
- **500** generic message on unexpected persistence failure (no stack in JSON)

`SafeUser`: `{ id, email, name, createdAt, updatedAt }` — never includes `passwordHash`.

### `POST /auth/sign-in`

**Body:** `{ "email", "password" }` (email trimmed)

- **200** `{ "user", "accessToken" }`
- **401** `{ "message": "Invalid credentials", "statusCode": 401 }` (same message for unknown email and wrong password)
- **400** validation errors

### `GET /auth/me`

**Header:** `Authorization: Bearer <accessToken>`

- **200** `{ "user": SafeUser }`
- **401** missing, malformed, expired, or invalid token

### Authentication behavior

- **Strategy:** Stateless JWT (Passport `jwt`); payload `{ sub: userId }`.
- **Logout:** Client-only — remove token from `sessionStorage` and clear React auth state. **No** `POST /auth/logout`; tokens remain valid until `JWT_EXPIRES_IN`.
- **CORS:** Single origin from `CORS_ORIGIN`; credentials not used for cookie sessions.
- **Rate limiting:** Global `@nestjs/throttler`; auth routes limited; health excluded.

OpenAPI: run the backend and open `/api/docs`, or `GET /api/docs-json`.

## Security decisions and known limitations

Documented in depth in [`docs/M06-security-findings.md`](docs/M06-security-findings.md). Summary:

| Topic | Decision |
|-------|----------|
| Passwords | bcrypt (cost 10); hash stored with `select: false` |
| Email | Lowercased in MongoDB schema; unique index |
| JWT | Bearer header; secret from env; no refresh tokens or server-side revocation |
| Client storage | `sessionStorage` (not `localStorage`) |
| CSRF | Low risk for Bearer-only API (no cookie session) |
| Errors | No password hashes in responses; generic 401/500 where appropriate |
| Rate limit | Configurable via `THROTTLE_*`; **429** on excess auth traffic |
| Logging | **`HTTP`**: method, path, status, duration (skips `GET /api/health`). **`MongoDB`**: Mongoose query operations on the backend stdout. Mongo **container** runs `mongod --quiet` with a TCP healthcheck to avoid `mongosh` spam every few seconds |

**View logs in Docker:**

```bash
docker compose logs -f backend    # HTTP + MongoDB operation lines
docker compose logs -f mongo      # quiet unless mongod errors/warnings
```

**Limitations:**

- JWTs still work after client logout until expiry.
- Health checks Mongoose connection state, not a live DB `ping`.
- No Helmet/HSTS in app code (use a reverse proxy in production).
- `npm audit` may report advisories — not fully remediated in this task.
- Manual responsive/accessibility audit of all breakpoints not automated.
- Docker Compose and full browser flow on `:8080` should be verified locally before demo.

## Repository layout

| Path | Purpose |
|------|---------|
| [`backend/`](backend/) | NestJS API |
| [`frontend/`](frontend/) | Vite React SPA |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | CI pipeline |
| [`docker-compose.yml`](docker-compose.yml) | Local full stack |
| [`AI.md`](AI.md) | AI assistance disclosure (submission requirement) |
| [`docs/M06-security-findings.md`](docs/M06-security-findings.md) | Integration/security review |

## Scripts reference

**Backend:** `start:dev`, `start:prod`, `build`, `format`, `format:check`, `lint`, `typecheck`, `test`, `test:e2e`, `start:e2e-live`

**Frontend:** `dev`, `build`, `preview`, `format`, `format:check`, `lint`, `typecheck`, `test`, `test:e2e`

## Submission checklist (recruiter)

- [ ] Push to a **public GitHub** repository (not done inside this repo automatically)
- [x] README with setup and usage
- [x] **AI.md** with AI usage disclosure

See [`AI.md`](AI.md) for task-requirement mapping and any gaps.
