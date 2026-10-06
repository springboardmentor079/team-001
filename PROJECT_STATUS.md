# BuildTrack project status

## Current implementation

The user selected **C:/Users/Anushka/OneDrive/Desktop/Infosys**. A new project-local Git repository on `codex/buildtrack` now contains the Phase 1 Angular 20 / Express 5 TypeScript / Prisma 6 / PostgreSQL foundation. Both nearby repositories remain untouched.

Implemented through Phase 12: secure authentication and administration, project scheduling and closure, site operations, equipment, inventory, workforce, procurement, finance, versioned documents, notifications, PDF/XLSX reports, analytics and provider-safe demo states. The completion pass added global search, invitations and enforced first-login password changes, session-family replay revocation and cross-tab refresh coordination, paginated project/team lists, weighted schedule baselines, daily-report attachments, document preview/deletion and 12-week equipment utilization. A public landing page and persistent contextual assistant cover the public and authenticated application. Business data is organization/project scoped and persisted in PostgreSQL. See README.md for verified run instructions and production limitations.

The following inspection is the historical baseline used to make the implementation decision. References to candidate A/B describe those external repositories, not defects in the new foundation.

## Original repository analysis

## Scope and evidence

Reviewed the supplied master implementation specification, the previously reviewed 17-page functional PDF and 10-page mockup PDF, repository trees, Git status, manifests, routes, authentication, data access, models, and representative UI implementations. This is a source-code inspection, not a claim that either application runs successfully.

The active workspace, `C:/Users/Anushka/OneDrive/Desktop/Infosys`, contains the reference PDFs and review intermediates, with no application manifest or project-local Git repository. Git discovery reaches an ancestor repository; it must not be used to stage this entire workspace indiscriminately.

Two distinct nearby repositories were found. The user has been asked which is the intended implementation target. Neither has been modified. Both contain uncommitted changes that must be preserved.

| Candidate                                                    | Existing architecture                                                                                                        | Git baseline                 |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `C:/Users/Anushka/Infosys Project/team-001`                  | Angular 20 + Python FastAPI + SQLAlchemy/Alembic + PostgreSQL configuration                                                  | `55f184b` plus local changes |
| `C:/Users/Anushka/OneDrive/Desktop/Infosys Project/team-001` | Root React 18/Vite UI and partial CommonJS Express controllers; nested `NavyaSri-Milestone-1` Angular 17/FastAPI application | `03b6342` plus local changes |

## 1. Existing functionality in source

### Candidate A: user-profile Infosys Project

- Angular bootstrapping, Bootstrap styling, login, signup, reset request/confirmation, and a workspace dashboard.
- Typed HTTP services call FastAPI for projects, milestones, resources, inventory, workers, and attendance.
- FastAPI routers implement authentication, users, projects, tasks, milestones, resources/allocation, inventory, and workforce operations.
- SQLAlchemy models and Alembic revisions establish domain tables. IDs are integers, unlike the requested UUID target.
- Password hashing and expiring access JWTs; public signup is correctly restricted to the client role.
- Reset tokens are hashed, stored with expiry, and marked used; administrator creation uses a CLI.
- Basic role checks exist in API dependencies. This is not the requested centralized permission system.
- npm scripts exist in the frontend. No runnable Node backend manifest: `backend/package.json` is empty.

### Candidate B: Desktop Infosys Project

- Root React application has substantial visual composition for projects, equipment, workforce, procurement, and login.
- Root backend contains parameterized SQL CRUD controllers and JWT/role middleware, but is not a complete runnable service.
- Nested Angular application has lazy routes, route guards, an HTTP interceptor, authentication forms, role dashboards, sidebar/navbar, profile, user administration, and project listing.
- Nested FastAPI application includes auth/users/projects/dashboard APIs, SQLAlchemy models, Alembic, seed script, and authentication/password-reset tests.
- Nested Dockerfiles, Compose configuration, and design documents exist.
- Root frontend uses React component state with example business data. Nested frontend uses RxJS/BehaviorSubject authentication state.

## 2. Missing or incomplete functionality

Neither candidate provides the requested integrated Angular + TypeScript Express + Prisma system.

Work requiring end-to-end verification and substantial implementation includes scoped role dashboards; centralized permissions; project membership and closure controls; scheduling/dependencies; daily/weekly site reports; delays and inspections; maintenance and utilization history; material request/allocation workflow; stock ledger; workforce allocation, shifts, payroll monitoring; vendor and procurement approval workflows; PO receiving and invoices; budgets and expense analytics; event-generated notifications; versioned documents; PDF/XLSX reporting; API-driven charts; global search; audit history; configured camera/weather providers; and production configuration.

Partial CRUD code is not counted as a completed workflow. Existing tests, Docker files, and model declarations are not proof of runtime correctness.

## 3. Confirmed code-level defects and risks

| Location                                                              | Evidence and impact                                                                                                                                                     |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A `frontend/angular.json`                                             | `npm test` invokes `ng test`, but no test target is configured.                                                                                                         |
| A `frontend/src/app/app.routes.ts`                                    | `/workspace` has no route guard. APIs still need independent protection.                                                                                                |
| A `backend/app/routers/projects.py` and `services/project_service.py` | Authenticated project reads query by ID or list without client/project-member scoping; manager writes also lack membership restrictions.                                |
| A `backend/app/routers/auth.py`                                       | Reset request creates a token but discards the delivery value, while saying instructions were sent. SMTP delivery is absent.                                            |
| A `backend/app/routers/resources.py`                                  | Allocation checks and decrements availability without a locking/conditional-update strategy; concurrent requests can oversubscribe. Release deletes allocation history. |
| B root `backend/server.js`, `backend/index.js`                        | Both are zero-byte files; no backend package manifest is present. Route/controller files alone do not start an API.                                                     |
| B root `frontend/services/authService.js`, `projectService.js`        | Both are empty.                                                                                                                                                         |
| B root `frontend/app.jsx`                                             | Login only checks for a nonempty email and accepts the selected role; project/material/resource/workforce/PO data are local arrays.                                     |
| B root `backend/controllers/authController.js`                        | Public signup accepts the submitted role; raw exception messages can be returned.                                                                                       |
| B nested `backend/app/schemas/auth.py`, `services/auth_service.py`    | Public registration accepts the role enum and persists the supplied role without a privilege restriction.                                                               |
| B nested `backend/app/api/auth.py`                                    | Forgot-password returns reset tokens in the public response; the inspected endpoint has no production-only exclusion.                                                   |
| B nested `backend/app/api/dashboard.py`                               | Some operational metrics are literal zero placeholders, and some assigned-project counts are global counts.                                                             |
| B nested `frontend/src/app/app.routes.ts`                             | Several modules route to a coming-soon component.                                                                                                                       |

Both Angular implementations persist access tokens in localStorage. The proposed design uses short-lived memory-held access tokens and rotating HTTP-only refresh cookies, with server-side session revocation.

## 4. Reusable components and logic

- A: Angular bootstrap and HTTP wiring; login/reset form structure; domain schemas; existing API semantics as migration fixtures; one-time reset-token pattern.
- B nested: sidebar/navbar/layout, role guards, interceptor, loading/stat-card components, lazy route organization, reactive authentication forms, existing tests as behavioral references.
- B root: visual spacing, cards, navigation composition, and construction styling can inform Angular components. React state and simulated actions are not reusable business services.
- Mockups: navy/orange shell, executive hierarchy, milestone cards, activity feed, equipment table, and budget composition. Fix column alignment, wrapped values, missing charts, and inconsistent example data.

## 5. Architecture problems and conflicts

1. Repository identity is unresolved; the current workspace is not either application repository.
2. Existing source uses FastAPI, while the new master specification explicitly requires Express/TypeScript. Preserve behavior through staged migration, not deletion.
3. Candidate B root uses React; its nested application uses Angular. Choose one active Angular frontend rather than maintaining competing application entry points.
4. Existing APIs vary between `/api` and nested response conventions; target `/api/v1` with typed, consistent envelopes.
5. IDs, role names, statuses, and response shapes differ. Data migration must explicitly map them.
6. Existing role-only checks do not establish organization ownership or project membership authorization.
7. No verified unified test/build/deploy pipeline across the requested stack.
8. The original PDF's FastAPI/SQLite references are superseded by the user's explicit Express/PostgreSQL decision.
9. The original eight-week milestones and new twelve-phase plan describe different planning levels; use the latest phase order without promising a delivery date.

## 6. Proposed changes

Use an Angular frontend and modular Express backend with PostgreSQL and Prisma. Introduce shared contracts and permission definitions; keep database access server-only. Establish design tokens, strict typing, validated config, consistent errors, auth, session lifecycle, route guards, responsive shell, and verification first. Separate business modules by feature. Expose only implemented navigation routes; do not introduce pretend business dashboards during Phase 1.

See `docs/PROJECT_ARCHITECTURE.md`, `docs/IMPLEMENTATION_PLAN.md`, and `docs/OPEN_DECISIONS.md`.

## 7. Required new modules

Auth/session, organization, permissions, projects/membership/tasks/milestones, site reporting/activity/delays/inspections, resources/allocations/maintenance, inventory/stock movement/material requests, workforce/attendance/shifts/payroll monitoring, vendors/procurement/POs/receipts/invoices, finance, notifications/outbox, reports, documents/versions, analytics/insights, audit, administration/settings, and optional camera/weather adapters.

## 8. Proposed dependencies (not installed)

- Preserve compatible Angular/RxJS versions in the chosen repository; add Chart.js and a consistent icon library as needed.
- Express, TypeScript, Prisma client/CLI, Zod, bcrypt or Argon2, JWT library, Helmet, CORS, rate limiting, cookie parsing, and structured logging.
- Nodemailer, local-storage adapter; S3/Cloudinary adapter dependencies only when configured.
- PDFKit or equivalent, ExcelJS, validated multipart upload handling; Socket.IO when notification events need it.
- Jest, Supertest, Angular test runner, Playwright, ESLint, Prettier.
- Use the chosen repository's working lockfile/package manager. Candidate manifests alone do not establish an authoritative lockfile strategy.
- Node/npm are available on PATH. Docker/psql were not found on PATH; that does not prove they are absent from the machine. Verify service/runtime availability after target selection.

## 9. Migration strategy

1. Select the target and record existing tracked/untracked changes without resetting or overwriting them.
2. Run baseline builds/tests and capture actual failures before refactoring.
3. Add the Node backend alongside the Python backend until behavior is covered by contract tests. Do not erase the existing backend.
4. Use a separate development database/schema. Never run destructive migrations against an existing database without inspecting and backing it up.
5. Map integer legacy IDs to UUIDs through an explicit migration map. Preserve foreign keys and audit references. Map role/status names; retain compatible bcrypt hashes after verification.
6. Switch Angular features incrementally to `/api/v1`; keep compatibility adapters where needed until each workflow passes integration tests.
7. Verify row counts, references, authorization boundaries, concurrency, and read/write parity before any production cutover.

## Original pre-implementation status

Started: repository discovery, source review, architecture and migration planning. Saved these planning files in the current workspace so neither candidate repository is changed before selection.

Not started: installing dependencies, modifying application code, applying migrations, seeding databases, or replacing entry points. Runtime builds/tests have not been executed. The repository choice is a required location clarification, not a request to reapprove the authorized work.

## Verification record

Both frontend and backend production builds passed. The final local suite includes 27 backend integration/ML tests, 7 Angular unit tests and 20 Playwright workflows. Fourteen migrations are applied to the development and isolated test databases and were replayed successfully on a fresh database. Executed results and resolved issues are recorded in docs/VERIFICATION.md.

Dockerfiles, development Compose and a CI workflow are supplied. Docker execution is unverified because Docker is unavailable on this host; local Node/PostgreSQL execution, fresh migrations, builds and test suites are verified. External SMTP, storage, weather and camera providers require deployment-specific credentials and configuration.
