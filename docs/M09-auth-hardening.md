# M09 — Auth hardening (email verification + sessions)

## Resolved gaps (from M06)

| Topic | Before M09 | After M09 |
|-------|------------|-----------|
| Email verification | None | SMTP (Mailpit in Compose); sign-up sends link; `/auth/verify-email`, `/auth/resend-verification` |
| Session storage | JWT in `sessionStorage` | Short-lived access JWT in memory; refresh in httpOnly cookie |
| Logout | Client-only | `POST /auth/logout` revokes refresh + bumps `tokenVersion` |
| Access revocation | None | JWT `ver` claim vs user `tokenVersion`; reuse detection revokes refresh family |
| CORS cookies | `credentials: false` | `credentials: true` on API + credentialed auth fetches on SPA |
| Helmet / CSP / HSTS | None | Helmet defaults; CSP for API; HSTS when `NODE_ENV=production` |
| npm audit (frontend) | 3 low (`deepmerge` via `shadcn`) | `overrides` for patched `deepmerge` |

## Dev mail

- **Compose:** Mailpit UI http://localhost:8025, SMTP `mailpit:1025`
- **Local backend:** point `SMTP_HOST` / `SMTP_PORT` at Mailpit or leave empty to capture messages in-memory (tests)

## Migration

Existing users without `emailVerifiedAt` are grandfathered on startup (`emailVerifiedAt = createdAt`) via `UserSchemaMigrationService`.

## Playwright live server

`EXPOSE_VERIFICATION_TOKEN=true` on the e2e live backend returns `verificationToken` on sign-up so browser tests can complete verification without Mailpit.
