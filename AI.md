# AI assistance disclosure

I used **Cursor** (Composer) for planning, implementation, test-driven edits, milestone reviews, and documentation. This file describes where that assistance applied, which prompts drove the work, what needed correction, and which decisions I made myself—especially from the post-M08 theme and auth-hardening work onward.

---

## 1. Which parts were AI-assisted

| Milestone | Scope |
|-----------|--------|
| **M00 / planning** | Requirements extraction, architecture, milestone plan, JWT Bearer + split `backend/`/`frontend/` |
| **M01 scaffolding** | NestJS + Vite React split, Prettier, oxlint, Vitest, env examples, health smoke |
| **M02 backend foundation** | Mongoose, User schema, repository contract, integration tests with mongodb-memory-server |
| **M03 sign-up** | `POST /api/auth/sign-up`, DTOs, RegisterUserUseCase, bcrypt, JWT on register |
| **M04 sign-in / me** | `POST /api/auth/sign-in`, `GET /api/auth/me`, Passport JWT guard; no server logout |
| **M05 frontend** | shadcn login-01, RHF + Zod, routes, sessionStorage, Vitest/RTL |
| **M06 integration & security** | Integration e2e, Playwright, throttling, shared HTTP bootstrap, findings doc |
| **M07 delivery & DX** | Dockerfiles, Compose, health + DB signal, Swagger, GitHub Actions CI |
| **M08 documentation** | This file and root README |
| **M09 auth hardening** | Email verification (SMTP/Mailpit), refresh rotation, Helmet, frontend session model; see [`docs/M09-auth-hardening.md`](docs/M09-auth-hardening.md) |
| **Post-M09** | Delete account API + UI; animated gradient shell; light/dark mode; HTTP and Mongo logging |

---

## 2. Milestone prompts used (verbatim)

The milestones were driven by the prompt series below (**Prompt 00–08**) plus the **post-milestone senior review** prompt after each implementation. Text is copied **verbatim** from the instructions used in this project. Prompt 00’s first use also attached the easygenerator **`Full_Stack_Test_Task.pdf`** task specification.

### Prompt 00

```markdown
# Role

Act as a senior full-stack engineer and pragmatic software architect. Help me implement the attached Full Stack Test Task using React + TypeScript, NestJS, and MongoDB.

# Engineering approach

I want production-conscious code, test-driven development (TDD), a clean modular architecture, and fast delivery. This task is designed to be completed in a few hours, so avoid unnecessary abstractions and overengineering.

# Your first task: analysis and planning ONLY

Do not create, edit, or delete files. Do not install dependencies. Do not implement code.

1. Extract every functional requirement, technical constraint, submission requirement, and evaluation criterion from the task specification.
2. Identify security risks, edge cases, ambiguities, and assumptions that affect the design.
3. Propose a pragmatic architecture for both frontend and backend.
4. Explain how the architecture maps to idiomatic NestJS conventions:
   - Modules and controllers
   - DTOs and validation pipes
   - Guards and authentication
   - Application services/use cases
   - Repository abstractions and MongoDB persistence
   - Exception filters and interceptors where appropriate
5. Recommend a minimal dependency stack. Justify each dependency and distinguish essential dependencies from optional ones.
6. Define the authentication and session strategy, including password hashing, credential verification, token/cookie handling, expiry, logout, CORS, CSRF considerations, and secret management.
7. Produce a dependency-aware implementation plan divided into small, independently verifiable milestones.
8. For each milestone, specify:
   - Objective and scope
   - Files/modules expected to change
   - Tests to write first
   - Implementation tasks
   - Commands to run
   - Acceptance criteria and definition of done
   - Likely failure modes
9. Design a test pyramid covering unit, integration, API end-to-end, and frontend tests.
10. Identify what should be deferred to keep the implementation within a few hours.

# Constraints

- Use TypeScript throughout.
- Frontend: React.
- Backend: NestJS.
- Database: MongoDB.
- Follow TDD: write a failing test, implement the smallest solution, then verify the test passes.
- Prefer simple, explicit code over clever abstractions.
- Never claim that a test or command passed unless you actually ran it and observed the result.
- Do not disable, weaken, or delete tests just to make the suite pass.
- Do not proceed to implementation until I approve the plan.

First inspect the repository and the task specification. If something important is missing, state the assumption rather than silently inventing a requirement.

Return the requirements checklist, proposed architecture, dependency recommendations, milestone plan, and unresolved decisions.
```

### Prompt 01

```markdown
Implement milestone 01 from the approved plan: project scaffolding and development configuration only.

First inspect the existing repository and follow its current structure if appropriate. Do not recreate or overwrite an existing project unnecessarily.

Requirements:
- React + TypeScript frontend.
- NestJS + TypeScript backend.
- MongoDB integration dependencies may be installed, but do not implement authentication or database models yet.
- Use npm unless the existing repository clearly uses another package manager.
- Configure appropriate ESLint and Prettier tooling, consistent with the selected framework versions.
- Add environment-variable examples without real secrets.
- Ensure environment-specific configuration is not committed.
- Configure frontend and backend test runners.
- Add sensible scripts for development, formatting, linting, type checking, and tests.
- Keep the frontend and backend independently runnable.
- Avoid adding dependencies that are not justified by the approved plan.

TDD and verification:
1. Identify the checks applicable to scaffolding.
2. Make the smallest changes necessary.
3. Run dependency installation, type checks, linting, and available test suites.
4. Fix errors rather than suppressing them.
5. Summarize files created, dependencies added, commands executed, actual results, and known limitations.

Do not implement signup, signin, authentication, UI features, or database models in this milestone. Stop when the scaffold is verified.
```

### Prompt 02

```markdown
Implement the approved backend-foundation milestone only.

Before editing, inspect the current codebase, approved architecture, installed dependency versions, and existing tests.

Requirements:
- Configure NestJS to connect to MongoDB using Mongoose.
- Read database configuration from validated environment variables.
- Create a User schema/model with the fields justified by the task.
- Include normalized email, name, password hash, and timestamps as appropriate.
- Enforce email uniqueness through a MongoDB unique index.
- Keep persistence concerns separate from application/business logic.
- If the approved design includes a repository abstraction, define a focused repository contract and a Mongoose implementation using idiomatic NestJS dependency injection.
- Do not introduce generic repository frameworks or unnecessary base classes.
- Do not expose the password hash in serialized API responses.
- Fail clearly when required configuration is missing or the database connection cannot be established.

TDD:
1. Write tests for the repository contract and relevant persistence behavior first.
2. Cover user creation, lookup by normalized email, duplicate-email handling, and safe handling of returned user data.
3. Use an isolated test database or an appropriate MongoDB test setup for integration tests. Do not connect tests to a production database.
4. Run the tests and verify that the new tests fail for the expected reasons before implementing.
5. Implement the smallest solution and rerun the tests.

Do not implement signup, signin, JWT/session handling, or controllers yet.

At completion, report the schema design, repository contract, dependency-injection strategy, tests executed, and any remaining risks. Do not claim integration tests passed if MongoDB was unavailable or those tests were skipped.
```

### Prompt 03

```markdown
Implement the signup feature as one complete, independently testable vertical slice.

Start by reading the approved architecture and existing code. Do not modify unrelated modules.

Expected API:
POST /auth/signup

Request fields:
- email: valid email address
- name: minimum 3 characters
- password: minimum 8 characters, including at least one letter, one number, and one special character

Use the exact validation rules from the task specification. Explicitly decide and document whitespace handling and email normalization.

Architecture:
- A SignupDto for request validation.
- An AuthController responsible only for HTTP concerns.
- An application service or focused RegisterUserUseCase for the registration workflow.
- A repository abstraction for persistence, if defined in the approved architecture.
- A password-hashing abstraction or focused injectable service if this materially improves testability.
- Appropriate NestJS exceptions and a consistent response contract.

Security:
- Hash passwords with a suitable password-hashing algorithm and safe configuration.
- Never store or return plaintext passwords.
- Never return password hashes.
- Enforce uniqueness in MongoDB and handle duplicate-key races correctly.
- Do not log credentials or password hashes.
- Do not rely on frontend validation for API security.

TDD sequence:
1. Write unit tests for the registration use case/service.
2. Cover successful registration, password hashing, duplicate email, and repository failures.
3. Write API-level tests for missing fields, invalid email, short name, weak password, and valid registration.
4. Run the tests and confirm the new tests fail for the expected reasons.
5. Implement the minimum required behavior.
6. Run focused tests, then the complete backend test suite, type checking, and linting.

Use mocks for isolated unit tests and a real test database for persistence integration tests.

Do not implement signin or frontend changes in this milestone.

At completion, report the API contract, files changed, test results, and any untested behavior.
```

### Prompt 04

```markdown
Implement signin and the protected current-user endpoint, following the approved authentication strategy.

Expected endpoints:
- POST /auth/signin
- GET /auth/me — protected endpoint returning the currently authenticated user's safe public profile
- POST /auth/logout if required by the selected authentication/session strategy

Before coding:
- Inspect the existing signup flow and all relevant tests.
- Confirm the authentication strategy already selected in the architecture.
- Do not silently switch strategies or introduce additional token types.

Requirements:
1. Validate signin input.
2. Find the user using normalized email.
3. Verify the submitted password against the stored password hash.
4. Reject invalid credentials without revealing whether the email exists.
5. Establish an authenticated session or issue credentials according to the approved strategy.
6. Protect /auth/me with the appropriate NestJS guard.
7. Return only the fields the frontend needs.
8. Implement logout consistently with the chosen strategy.
9. Configure token/session expiry, cookie flags, CORS, and CSRF protections as appropriate for that strategy.
10. Read secrets from environment configuration and fail safely when required secrets are missing.

Do not assume JWT alone solves session security. If using JWTs, explain storage, expiry, revocation/logout behavior, and any refresh-token decisions. If using cookies, consider CSRF and cross-origin behavior.

TDD:
- Unit tests: valid credentials, invalid password, unknown email, repository failure, credential verification.
- Authentication tests: missing credentials, malformed/expired/invalid credentials, protected route without authentication, and protected route with valid authentication.
- Logout tests appropriate to the chosen strategy.
- Verify that protected responses do not leak password hashes or other private fields.
- Test the actual HTTP behavior rather than only mocking the guard.

Write failing tests first, implement incrementally, and run the focused and complete suites.

Do not implement the React UI or unrelated features in this milestone. Finish with a security-focused summary and actual test results.
```

### Prompt 05

```markdown
Implement the React frontend milestone using the existing backend API contract.

First inspect the current frontend, package versions, API DTOs/contracts, and existing tests. Do not invent endpoint names or response shapes.

## UI Design Requirements

**Use the official shadcn/ui Login Blocks as the design foundation for the authentication pages:**
https://ui.shadcn.com/blocks/login

- Review the available login blocks and select a design appropriate for a modern, professional authentication application.
- Use the selected shadcn/ui login block as the starting point for both the signup and signin pages, adapting its layout and components as necessary.
- Use shadcn/ui components consistently throughout the authentication flow rather than building a completely separate design system.
- Preserve the visual quality, spacing, typography, responsiveness, and accessibility of the selected design.
- Reuse appropriate components for inputs, buttons, cards, labels, form errors, and other interface elements.
- Do not blindly copy a block without adapting it to the application's actual requirements.
- If the chosen block does not provide a signup layout, adapt its components and styling to create a consistent signup page.
- Build a matching protected application page that displays: "Welcome to the application."
- Keep the design responsive and accessible, including keyboard navigation, associated form labels, and visible focus states.

Use the official shadcn/ui documentation and installation instructions:
https://ui.shadcn.com/docs

Do not generate a generic authentication design if an appropriate login block is available. Inspect the actual block and reuse its design and components.

## Functional Requirements

Build three views:

1. Signup page.
2. Signin page.
3. Protected application page.

- React + TypeScript.
- Use React Hook Form and Zod if they fit the approved dependency plan.
- Match frontend validation to the backend rules, while treating backend validation as authoritative.
- Show loading states and prevent duplicate form submissions.
- Display useful validation errors and safe API error messages.
- On successful signup, follow the backend's actual behavior; do not assume signup automatically authenticates the user.
- On successful signin, navigate to the protected application page.
- Restore authentication state on page reload using the approved session/token strategy.
- Handle expired or invalid authentication without exposing private data.
- Implement logout if supported by the backend.
- Avoid putting long-lived authentication credentials in localStorage.
- Configure credentialed requests if cookie-based authentication is used.
- Configure the API base URL through environment variables.

## TDD and Verification

1. Write component tests for signup and signin validation.
2. Test loading, success, API errors, and duplicate submissions.
3. Test protected-page behavior for authenticated and unauthenticated users.
4. Test logout and session restoration where applicable.
5. Use mocked API responses for isolated frontend tests.
6. Run tests before and after implementing each feature.
7. Verify the final UI against the selected shadcn/ui login block and check responsive behavior.

Keep HTTP concerns, form validation, and UI components appropriately separated.

Do not modify backend authentication semantics just to simplify frontend code.

At completion, report the components reused, files changed, tests executed, actual results, and any remaining integration assumptions.
```

### Prompt 06

```markdown
Perform an integration and security-hardening milestone on the existing application.

Do not rewrite working code or add features unrelated to the task.

First inspect the implementation and identify the most important gaps against the task specification and approved architecture.

# API integration and end-to-end testing

Create or improve tests that exercise the real HTTP application and a test database.

Verify:
- Successful signup and signin.
- Signup validation for every required field.
- Duplicate signup attempts, including database-level uniqueness behavior.
- Correct password hashing and credential verification.
- Invalid signin attempts and consistent credential errors.
- Access to GET /auth/me without credentials, with invalid credentials, and with valid credentials.
- Correct logout and session behavior.
- Response serialization never exposes password hashes.
- Unexpected persistence errors produce safe, consistent responses.

# Frontend integration

Verify that the frontend can:
- Register an account.
- Sign in.
- Reach the protected application page.
- Reload the page and restore authentication correctly.
- Handle failed authentication, expired sessions, and logout.
- Display API errors without leaking internal details.

# Security review

Inspect:
- Password hashing configuration.
- Input validation and normalization.
- Database uniqueness and race conditions.
- Authentication expiry and logout semantics.
- Cookie flags or token storage, as appropriate.
- CORS and CSRF configuration.
- Rate limiting for authentication endpoints.
- Secret handling and environment configuration.
- Logging of sensitive data.
- Error responses and stack-trace leakage.
- Dependency versions and known configuration mistakes.

# Rules

1. Add regression tests before fixing discovered bugs.
2. Make small, focused changes.
3. Never weaken tests or suppress errors to obtain a passing suite.
4. Do not claim a security property is verified merely because a configuration option exists.
5. Run the relevant test suites and report the actual results.
6. Distinguish confirmed findings from risks that still require manual verification.

At completion, produce a concise findings report with severity, affected files, fixes, regression tests, and remaining limitations.
```

### Prompt 07

```markdown
Implement the delivery and developer-experience milestone for the existing application.

Keep the setup simple enough for another developer or recruiter to run locally.

# Docker and local development

- Create appropriate Dockerfiles for the frontend and backend.
- Add a Docker Compose configuration for the application and MongoDB.
- Use persistent storage for MongoDB.
- Add a database health check and appropriate service startup dependencies.
- Ensure the backend handles database connection failures gracefully.
- Configure environment variables using an example file and documented setup steps.
- Never bake real secrets into images or commit them to Git.
- Use appropriate production build stages and avoid unnecessary development dependencies in runtime images.
- Make sure the frontend uses the correct API URL in the intended runtime environment.

# CI

Add a lightweight GitHub Actions workflow that:
- Installs dependencies reproducibly.
- Runs formatting checks, linting, and type checking.
- Runs backend and frontend unit tests.
- Runs integration/e2e tests when the necessary test database can be provided.
- Fails the workflow when a required check fails.

Use a MongoDB service container or another reliable isolated test-database setup where necessary. Do not silently skip required tests in CI.

# API documentation

Add Swagger/OpenAPI documentation using NestJS conventions.
Document request DTOs, success responses, validation errors, authentication requirements, and the protected endpoint.

# Verification

- Run Docker Compose and verify that the services start.
- Exercise signup, signin, the protected endpoint, and logout through the running application.
- Run the same required checks that CI runs.
- Fix configuration issues instead of documenting broken commands as working.

Report the exact commands executed, actual results, and any limitations. Do not claim a container build, integration test, or CI run succeeded without verifying it.
```

### Prompt 08

```markdown
Prepare the final documentation for this repository based on the implementation that actually exists.

Inspect the source code, package scripts, environment configuration, tests, Docker setup, GitHub Actions workflow, and available command/test results before writing anything.

# README.md

Include:
- Project overview and implemented features.
- Technology stack and high-level architecture.
- Prerequisites.
- Local development setup.
- Environment variables and how to configure them.
- How to run frontend, backend, and MongoDB.
- Docker Compose setup.
- How to run unit, integration, and e2e tests.
- Linting and type-checking commands.
- API endpoint documentation and authentication behavior.
- Security decisions and known limitations.

Ensure every documented command matches the actual package scripts and configuration.

# AI.md — mandatory

Write a truthful account of how AI assistance was used in this project.

Include:
1. Which parts were AI-assisted.
2. The actual prompts or representative prompts used.
3. Which approaches were effective and why.
4. What generated code or recommendations required correction or rework.
5. Important engineering decisions I made rather than blindly accepting AI output.
6. How TDD was used to validate generated code.
7. Any remaining limitations or unverified assumptions.

Use the actual conversation and repository evidence available. Do not invent debugging stories, prompts, tests, or mistakes merely to make the document look impressive. If the full AI conversation is unavailable, explicitly use representative prompts and distinguish them from exact historical prompts.

Finally, compare the implementation against every requirement in the original task specification and produce a completion checklist. Clearly identify anything missing.

Do not modify application behavior in this milestone unless a documentation inconsistency exposes a real issue. Report the files created and any discrepancies found.
```

### Post-milestone review prompt (used after each milestone)

```markdown
Review the milestone you just implemented as a critical senior engineer.

Do not add new features.

1. Compare the implementation against the milestone's acceptance criteria.
2. Inspect the actual diff for unnecessary complexity, duplicated logic, unsafe defaults, incorrect assumptions, and unrelated changes.
3. Identify missing edge cases and the highest-risk bugs.
4. Check whether tests assert meaningful behavior or merely implementation details.
5. Identify any important behavior that is not covered by tests.
6. Run the relevant test commands, linting, and type checking.
7. Fix any issues within the scope of the current milestone and add regression tests where needed.
8. Rerun the affected tests and the complete relevant suite.

Do not delete or weaken tests, skip failures, or suppress errors without a justified reason.

Return:
- Acceptance criteria: pass/fail/untested.
- Commands actually executed and their results.
- Bugs found and fixes applied.
- Remaining risks and limitations.
- Whether the milestone is genuinely ready for the next step.

If any critical acceptance criterion fails, stop and explain what remains to be fixed.
```

**Note on Prompt 03–04 vs shipped API:** The prompts above use `/auth/signup` and `/auth/signin` without the global prefix. The approved plan and implementation use **`POST /api/auth/sign-up`**, **`POST /api/auth/sign-in`**, and **`GET /api/auth/me`**. Prompt 01 asked for ESLint; this repo uses **oxlint** where linting was added (see section 4).

---

## 3. Approaches that worked well

- **Milestone plans with explicit API contracts** (paths, status codes, JSON shapes) before UI or Docker work reduced rework.
- **TDD slices:** failing test → minimal implementation → full suite (especially auth use cases and Zod schemas aligned with backend DTOs).
- **mongodb-memory-server** for backend e2e and Playwright live server — no dependency on a developer’s local Mongo for CI.
- **Shared `configureHttpApp`** (+ Swagger in e2e helper) so tests match production HTTP behavior (prefix, validation pipe, CORS).
- **Milestone review pass** after M07 caught missing **503 health** HTTP coverage and a fragile exception assertion in unit tests.

---

## 4. Corrections and rework (actual)

| Issue | What happened | Fix |
|-------|----------------|-----|
| TypeScript 7 frontend | Deprecated `baseUrl` in tsconfig | Removed; paths-only aliases |
| Password validation test | Frontend test assumed uppercase rule | Aligned with backend (letter class, not uppercase-only) |
| Playwright emails | Long generated local-parts failed email validation | Shorter `user-{label}-{ts}@example.com` |
| E2e live server | Running Nest via `tsx` broke decorators/guards/DI | Run compiled **`node dist/main.js`** ([`run-e2e-live-server.mjs`](backend/test/helpers/run-e2e-live-server.mjs)) |
| Throttler bootstrap | Standalone app needed global guard registration | `APP_GUARD` + `@SkipThrottle()` on health |
| Mongoose schema under tsx | Ambiguous `@Prop()` types | Explicit `type: String` on user fields |
| JwtStrategy DI | ConfigService injection under alternate bootstrap | `@Inject(ConfigService)` on strategy |
| M07 ESM production build | Value import `Connection` from mongoose in `app.service.ts` | Changed to **`import type { Connection }`** so `dist/` runs under Node ESM |
| M07 Swagger paths | OpenAPI JSON 404 under global prefix | `useGlobalPrefix: true` in Swagger setup |
| M07 Prettier | Auth controller formatting | `npm run format` on backend |
| M07 review | No HTTP test for degraded health | E2e asserting **503** + body; improved `ServiceUnavailableException` assertion |

No tests were deleted or skipped to force green builds.

---

## 5. Engineering decisions (mine vs. default AI suggestions)

### 5.1 Initial planning (Prompt 00 — before implementation)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Repo layout | `backend/` + `frontend/` (not npm workspaces) | Keeps services independently runnable |
| API prefix | Global **`/api`** + kebab-case **`sign-up` / `sign-in`** | REST style; differs from prompt examples without prefix |
| Rate limiting | Global throttler, health excluded | Simple default; tunable via env |
| Compose ports | Frontend **8080**, API **3000**, browser calls host **3000** | Matches local Docker demo |
| Linting | **oxlint** (type-aware on backend) where lint was added | Prompt 01 mentioned ESLint; adopted oxlint for this repo |

### 5.2 Decisions after M08 (directed implementation in Cursor)

From **`d0c467d`** through **`01ba337`**, I chose the scope below and used Cursor to implement it. These supersede parts of the original M03–M05 session model (see §5.3).

1. **Animated gradient background + light/dark mode** (`d0c467d`) — Polished app shell with theme toggle on auth layouts and a separate toggle in the app header (not overlapping logout).

2. **Operational logging** (`fefdad4`, `f9ec976`) — HTTP access logging, Mongoose query logging, and quieter MongoDB in Compose (`--quiet`, lighter healthchecks).

3. **Auth hardening — M09** (`a3e5e4d`) — Full plan committed as a single milestone. What was added:

   **Backend — data and persistence**
   - User fields: `emailVerifiedAt`, hashed email-verification token + expiry, `tokenVersion` for access-token invalidation.
   - `RefreshToken` Mongoose schema, repository contract, and integration tests.
   - Startup migration: users without `emailVerifiedAt` are grandfathered (`emailVerifiedAt = createdAt`).

   **Backend — auth flows**
   - Sign-up returns a message (no session); sends verification link via **`EmailModule`** / **`SmtpEmailService`** (hashed opaque tokens, TTL from env).
   - **`POST /api/auth/verify-email`**, **`POST /api/auth/resend-verification`**; sign-in blocked until email is verified.
   - **`TokenService`**: short-lived access JWT (`sub`, `ver`, `typ`); opaque refresh tokens with rotation; reuse detection revokes the refresh family and bumps `tokenVersion`.
   - **`POST /api/auth/refresh`**, **`POST /api/auth/logout`**; httpOnly refresh cookie helpers in **`auth-cookies.ts`**; **`JwtStrategy`** validates `ver` against the user record.
   - Extended env validation (SMTP, cookie/JWT settings); **`cookie-parser`**; CORS **`credentials: true`**.

   **Backend — HTTP hardening**
   - **Helmet** (CSP for API responses, HSTS in production) via **`configure-http-app.ts`**.

   **DevOps and configuration**
   - **Mailpit** service in **`docker-compose.yml`** (SMTP **1025**, UI **8025**); SMTP variables in root and **`backend/.env.example`**.

   **Tests**
   - **`email-verification.e2e-spec.ts`**, **`token.service.spec.ts`**, refresh-token repository integration spec; updates to sign-up/sign-in/me/integration e2e and auth e2e helpers; **`opaque-token.spec.ts`**.

   **Frontend**
   - In-memory access token only (no long-lived JWT in **`sessionStorage`**); session bootstrap via credentialed **`POST /auth/refresh`** in **`AuthContext`**.
   - **`CheckEmailPage`**, **`VerifyEmailPage`**, routes and tests; **`auth-api`** / **`api-client`** send credentials on auth calls.
   - Playwright: verification helper when **`EXPOSE_VERIFICATION_TOKEN`** is set on the e2e live server; updated **`auth-flow.spec.ts`**.

   **Documentation**
   - **[`docs/M09-auth-hardening.md`](docs/M09-auth-hardening.md)**, README auth/session section, **AI.md** and env example updates.

   **Policy choices embedded in M09**

   | Decision | Choice | Implemented as |
   |----------|--------|----------------|
   | Outbound email in dev | SMTP + Mailpit in Compose | `SMTP_HOST=mailpit`, UI **8025**, SMTP **1025** |
   | Session model | Short access JWT in memory + httpOnly refresh cookie | Bootstrap via **`POST /auth/refresh`** |
   | Sign-up | Verify email before any session | Check-email + verify routes |
   | Revocation | Refresh rotation + logout + `tokenVersion` on access JWT | Reuse detection revokes refresh family |

4. **Delete account** (`01ba337`) — Password-confirmed **`DELETE /api/auth/account`** (user + refresh tokens removed, session cookie cleared). UI on **`/app`**: **“Delete account…”** reveals the form; submit disabled until password length ≥ 8 (no separate min-length error message). Unit, e2e, and **`DeleteAccountSection`** component tests.

### 5.3 Superseded early decisions (for reviewers)

| Earlier (M03–M05) | Superseded by M09 |
|-------------------|-------------------|
| JWT only in **`sessionStorage`** | In-memory access token + refresh cookie |
| Sign-up returns **`accessToken`** immediately | 201 with **`message`**; session after verify |
| Logout client-only | **`POST /auth/logout`** + refresh revocation |

---

## 6. How TDD validated generated code

Examples grounded in this repo:

- **M02:** Repository integration tests written first for create, find-by-email, duplicate email, safe serialization (no hash in API types).
- **M03:** `register-user.use-case.spec.ts` before controller; `auth.sign-up.e2e-spec.ts` for HTTP validation matrix.
- **M04:** Sign-in use case tests (unknown user vs wrong password same error path); `auth.me.e2e-spec.ts` for Bearer matrix.
- **M05:** `auth-schemas.test.ts`, page tests with **mocked** `auth-api`, AuthContext session restore tests.
- **M06:** `auth.integration.e2e-spec.ts`, `auth.throttle.e2e-spec.ts`, `frontend/e2e/auth-flow.spec.ts`.
- **M07:** `app.service.spec.ts` for readyState; e2e for `/api/docs-json` and **503** health; full suites run before closing milestone.
- **M09:** Email verification e2e with captured mail; refresh/logout e2e; `tokenVersion` in JWT strategy tests.
- **Delete account:** `delete-account.use-case.spec.ts`, `auth.delete-account.e2e-spec.ts`, `DeleteAccountSection.test.tsx`.

Policy used throughout prompts: **do not claim tests passed without running them**; do not weaken failing tests.

---

## Task specification completion checklist

Source: easygenerator **Full Stack Test Task** PDF (functionality + submission + bonus criteria). Status reflects **this repository as implemented**.

### Front-end requirements

| Requirement | Status | Notes |
|-------------|--------|--------|
| React + TypeScript | **Done** | Vite React 19 |
| Sign-up form (email, name, password rules) | **Done** | Zod + backend-aligned rules |
| Sign-in form (email, password) | **Done** | |
| App page welcome text exactly | **Done** | `"Welcome to the application."` |
| Logout (optional in spec) | **Done** | Server logout + refresh revocation |
| Delete account | **Done** (post-spec) | Password-confirmed; progressive UI on `/app` |
| Design / creativity | **Done** | shadcn login-01; gradient shell; light/dark mode |

### Back-end requirements

| Requirement | Status | Notes |
|-------------|--------|--------|
| NestJS + MongoDB | **Done** | Mongoose |
| At least one protected endpoint | **Done** | `GET /api/auth/me` |
| Sign-up / sign-in APIs matching field rules | **Done** | See README |
| README for working with repo | **Done** | Root README (this milestone) |

### Submission requirements

| Requirement | Status | Notes |
|-------------|--------|--------|
| Public GitHub repository | **Pending** | Push and share link as part of submission |
| **AI.md** | **Done** | This file |

### Bonus / production-readiness (scoring)

| Item | Status | Notes |
|------|--------|--------|
| Testing | **Done** | Unit, backend e2e, Playwright |
| Basic CI/CD | **Done** | `.github/workflows/ci.yml` |
| API documentation | **Done** | Swagger `/api/docs` |
| Error handling | **Partial** | Nest validation + generic auth errors; no global exception filter |
| Logging | **Partial** | HTTP + Mongo query logging; not a structured logging platform |
| Security hardening | **Done** | Email verification, refresh rotation, Helmet, `tokenVersion` — [`docs/M09-auth-hardening.md`](docs/M09-auth-hardening.md) |

---

## Verification snapshot (updated after M09 + delete account)

Last full runs during M09 / delete-account work (2026-10-29):

```text
cd backend && npm test && npm run test:e2e
→ 49 unit passed; 45 e2e passed

cd frontend && npm test && npm run test:e2e
→ 43 unit passed; 4 Playwright passed
```

Docker Compose was verified during M07 and M09 manual flows (health, Swagger, Mailpit, auth). CI workflow still mirrors backend + frontend unit tests and Playwright (no Compose job).

---

## Readiness

The implementation covers the functional task requirements and most bonus items (tests, CI, Swagger, Docker, hardened auth). Post-spec work (theme, delete account, M09) extends security and UX beyond the original brief. A public GitHub push remains the outstanding submission step.
