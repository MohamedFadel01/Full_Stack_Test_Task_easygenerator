# M06 — Security and integration findings

**Date:** 2026-10-29  
**Scope:** Auth module integration tests, Playwright full-stack flows, security hardening (rate limiting, bootstrap parity).

## Verification commands (actual results)

```text
cd backend && npm run typecheck && npm run lint && npm run test && npm run test:e2e
# unit: 23 passed; e2e: 32 passed (6 files)

cd frontend && npm run typecheck && npm run lint && npm run test && npm run test:e2e && npm run build
# unit: 32 passed; Playwright: 3 passed; build: success
```

## Acceptance mapping

| Requirement | Status | Evidence |
|-------------|--------|----------|
| HTTP sign-up / sign-in / me (real app + memory Mongo) | **Pass** | Existing + [`auth.integration.e2e-spec.ts`](../backend/test/auth.integration.e2e-spec.ts) |
| Sign-up validation (all rules + missing fields) | **Pass** | Integration + existing sign-up e2e |
| Duplicate + case-insensitive + parallel race | **Pass** | Integration e2e |
| bcrypt storage + credential verify | **Pass** | Integration e2e (`$2` prefix + sign-in) |
| Invalid sign-in generic errors | **Pass** | sign-in e2e |
| `/me` auth matrix | **Pass** | auth.me e2e |
| Safe 500 / no stack in JSON | **Pass** | Integration e2e (incl. `NODE_ENV=production`) |
| No `passwordHash` in responses | **Pass** | Integration chain + existing e2e |
| Client logout / session (no server revoke) | **Pass** | Playwright reload + logout |
| Frontend register / sign-in / app / reload / errors | **Pass** | [`frontend/e2e/auth-flow.spec.ts`](../frontend/e2e/auth-flow.spec.ts) |
| Auth rate limiting | **Pass** | `@nestjs/throttler` + [`auth.throttle.e2e-spec.ts`](../backend/test/auth.throttle.e2e-spec.ts) (429) |
| Manual responsive UI / npm audit triage | **Untested** | See limitations |

## Fixes applied

| Severity | Finding | Fix | Regression test |
|----------|---------|-----|-----------------|
| Medium | E2e live server failed under `tsx` (decorators / guards) | Run compiled `dist/main.js` via [`run-e2e-live-server.mjs`](../backend/test/helpers/run-e2e-live-server.mjs) | Playwright suite |
| Medium | `ThrottlerGuard` DI failure on standalone bootstrap | Global `APP_GUARD` + `@SkipThrottle()` on health | Backend e2e + live server |
| Low | Mongoose `@Prop` types ambiguous under `tsx` | Explicit `type: String` on user schema | Integration + live server |
| Low | `JwtStrategy` `ConfigService` injection under `tsx` | `@Inject(ConfigService)` | Live server boot |
| Low | Playwright emails with long Playwright `testId` failed validation | Shorter `user-{label}-{ts}@example.com` | Playwright register test |

## Confirmed security properties

- **Password hashing:** bcrypt cost factor **10** ([`bcrypt-password-hasher.service.ts`](../backend/src/auth/bcrypt-password-hasher.service.ts)); hashes stored with `select: false`; not returned in API JSON (e2e asserted).
- **Validation / normalization:** DTO trim + class-validator; email **lowercase** in Mongoose schema; duplicate email → **409**.
- **Authentication:** JWT Bearer; `GET /auth/me` returns **401** for missing, malformed, expired, or invalid `sub` (no user enumeration on sign-in).
- **Client session:** `sessionStorage` only; logout clears storage (Playwright); **JWT remains valid server-side until expiry** (by design).
- **CORS:** Single origin from `CORS_ORIGIN`; Bearer auth (no cookie session → **CSRF risk low** for auth API).
- **Rate limiting:** Global throttler with **`@SkipThrottle()`** on `/api/health`; auth routes limited per `THROTTLE_*` env (429 verified).
- **Secrets:** `JWT_SECRET` required at startup; examples only in `.env.example`.
- **Error leakage:** Registration persistence failures return generic **500** message; response body has **no `stack`** (e2e); production-mode test avoids echoing internal error text.
- **Logging:** No password logging found in auth source (manual grep).

## Risks and limitations (manual or residual)

| Severity | Item | Notes |
|----------|------|--------|
| Medium | **No JWT revocation** after client logout | Documented; token valid until `JWT_EXPIRES_IN`. |
| Medium | **`getMe` bootstrap on 5xx/network** | Token may remain in `sessionStorage` while UI is unauthenticated. |
| Low | **Throttling applies globally** except health | Acceptable for this app size; tune `THROTTLE_*` in production. |
| Low | **npm audit** (backend/frontend moderate/high advisories) | Run `npm audit` and triage separately; not auto-fixed in M06. |
| Informational | **XSS → token theft** | Inherent to `sessionStorage`; mitigated by avoiding inline HTML injection. |
| Informational | **Helmet / HSTS** | Not added; rely on reverse proxy in production. |

## Readiness

M06 deliverables are complete: backend integration coverage, Playwright full-stack auth flows, rate limiting with regression tests, shared HTTP bootstrap, and this findings report. Suitable to proceed to submission polish (CI, public repo, final AI.md review).
