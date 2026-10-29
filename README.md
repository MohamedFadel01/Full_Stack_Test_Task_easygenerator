# Full Stack Test Task (Easygenerator)

Auth module scaffold: **NestJS** API in [`backend/`](backend/) and **React** SPA in [`frontend/`](frontend/).

## Prerequisites

- **Node.js 20 LTS** (or newer)
- **npm**
- **MongoDB** is required for the backend from milestone **M02** onward (`MONGODB_URI` in `backend/.env`). Use a local MongoDB instance or Docker, for example: `docker run -d -p 27017:27017 mongo:7`
- Automated tests use **mongodb-memory-server** and do not connect to your development database

## Setup

```bash
# Backend
cp backend/.env.example backend/.env
cd backend && npm install

# Frontend
cp frontend/.env.example frontend/.env
cd frontend && npm install
```

## Development

Run each app in its own terminal. The backend requires `MONGODB_URI` and `JWT_SECRET` in `backend/.env`.

```bash
cd backend && npm run start:dev   # http://localhost:3000/api/health
cd frontend && npm run dev        # http://localhost:5173
```

### Auth API (M03–M04)

All auth routes are under the `/api` prefix. Send the JWT as **`Authorization: Bearer <accessToken>`**.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/sign-up` | Register (see M03 validation rules) |
| POST | `/api/auth/sign-in` | Sign in with `{ "email", "password" }` → **200** `{ user, accessToken }` |
| GET | `/api/auth/me` | Current user profile → **200** `{ user }` (requires Bearer token) |

**Sign-up** (`POST /api/auth/sign-up`): body `{ "email", "name", "password" }` — **201** `{ user, accessToken }`; validation **400**; duplicate **409**.

**Sign-in** failures return **401** with `"Invalid credentials"` (same message for unknown email and wrong password).

**Logout:** Stateless JWT — there is **no** server `POST /auth/logout`. The client removes the token (frontend milestone). Tokens remain valid until `JWT_EXPIRES_IN` (default `1h`) unless you add revocation later.

## Quality checks

```bash
cd backend && npm run typecheck && npm run lint && npm run format:check && npm test && npm run test:e2e
cd frontend && npm run typecheck && npm run lint && npm run format:check && npm test
```

## Scripts reference

| Location | Scripts |
|----------|---------|
| `backend/` | `start:dev`, `build`, `lint`, `format`, `format:check`, `typecheck`, `test`, `test:e2e` |
| `frontend/` | `dev`, `build`, `lint`, `format`, `format:check`, `typecheck`, `test`, `test:watch` |

## AI usage

See [AI.md](AI.md) for how AI tools were used on this project.
