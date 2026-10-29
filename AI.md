# AI assistance disclosure

This file will be completed before final submission. Sections below are filled in as work progresses.

## Tools used

- Cursor (AI-assisted editing, planning, and test-driven implementation)

## What was AI-assisted

- **M0 scaffolding:** NestJS + Vite React split layout, health check, env examples
- **M02 backend foundation:** User schema, repository contract, MongoDB wiring, integration tests with mongodb-memory-server
- **M03 sign-up API:** `POST /api/auth/sign-up`, RegisterUserUseCase, bcrypt, JWT on registration
- **M04 sign-in and me:** `POST /api/auth/sign-in`, `GET /api/auth/me` with JWT Bearer guard; no server logout
- **M05 frontend auth UI:** React Router pages (`/sign-in`, `/sign-up`, `/app`), shadcn/ui **login-01** layout, React Hook Form + Zod validation aligned with backend DTOs, JWT in `sessionStorage`, client-only logout, Vitest/RTL tests with mocked API
- **M06 integration & security:** Backend auth integration e2e, Playwright full-stack flows, `@nestjs/throttler` on auth (health skipped), shared `configureHttpApp`, findings in `docs/M06-security-findings.md`

## Prompts and approaches that worked well

- Milestone plans with explicit API contracts (paths, status codes, response shapes) before UI work
- TDD slices: Zod schemas → API client → AuthContext → page tests with mocked `auth-api`
- shadcn CLI (`init`, `add login-01`) on existing Vite + Tailwind v4 setup

## Corrections and rework

- TypeScript 7: removed deprecated `baseUrl` from frontend tsconfig (paths-only aliases)
- Frontend password validation test adjusted to match backend (letter class, not uppercase-only)
- Review pass: Prettier on auth sources, semantic `<h1>` titles on auth cards for accessibility
- M06: Playwright email local-part length; e2e live server via compiled `dist/main.js` instead of `tsx` bootstrap

## Decisions made differently from AI suggestions

- Sign-up success: persist `accessToken` from **201** and navigate to `/app` (API returns token; not a separate sign-in step)
- Token storage: **`sessionStorage`** + Bearer header (`credentials: 'omit'`), not cookies or `localStorage`
