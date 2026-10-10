# BuildTrack

Construction project management and site monitoring, built incrementally with Angular, Express/TypeScript, Prisma and PostgreSQL.

## Current release: complete local milestone implementation

Implemented and connected to PostgreSQL: registration, login, refresh/logout, password reset, forced first-login password changes, profile updates, six seeded roles, server-side permission checking, organization-isolated team administration (invitation delivery, create, edit, role assignment, activation/deactivation, reset delivery, pagination and last login), account overview, audit activity, responsive navigation, global search, loading/error states and API documentation.

Project records support create/edit, explicit team assignment, server-side pagination/sorting, details, search/status filters, budget/estimate amounts and validated closure. Dependency-aware weighted schedules retain original baselines, daily reports accept verified attachments, equipment shows 12 weeks of time-based utilization, and document records support preview and deletion. Inventory, workforce, procurement, finance, notifications, exports and cross-module analytics are persisted and permission-scoped. Payroll is labeled as an approved-hours estimate; weather is labeled as demo data and camera feeds remain visibly unconfigured. Demonstration records are added idempotently by the development seed, including approved expenses, category allocations and purchase commitments for every operational demo project so the finance dashboard opens with meaningful actual and forecast values.

ML Insights adds organization-scoped models for schedule-delay probability, material demand, cost at completion and equipment failure risk. The development seed supplies 12 completed schedule outcomes, 12 settled project-cost outcomes, 12 weekly observations for each of three materials and 14 maintenance outcomes, so every model has an immediately visible demonstration. Models expose their sample requirements, readiness and diagnostic limitations. Insufficient history returns no prediction, and predictions never change operational records automatically. Replace labelled synthetic outcomes with verified organization history before operational use.

The public root route now presents the BuildTrack platform before sign-in. A persistent BuildTrack Assistant is available on every public and authenticated page. Public questions use product guidance; signed-in questions pass through the authorized API and may use organization-scoped summary counts. Chat messages are not stored. The assistant is currently a transparent context engine rather than an external generative-model integration.

All twelve implementation milestones are represented in the local application and verification suite. Production rollout still requires managed storage, SMTP/provider credentials, TLS, backups, monitoring and a deployment review. Docker configuration is supplied but could not be executed on this machine because Docker is not installed.

The chosen repository is `C:/Users/Anushka/OneDrive/Desktop/Infosys`. The nearby repositories were inspected as references and have not been changed.

## Architecture and source

- `frontend/src/app/core`: auth state, guards, HTTP interceptor, typed contracts, icons.
- `frontend/src/app/layout`: responsive sidebar and header.
- `frontend/src/app/features/auth`: login, registration, forgot/reset forms.
- `frontend/src/app/features/account`: overview, profile, security, team directory.
- `frontend/src/app/features/projects`: project list, form and details.
- `backend/src/modules/users`: administrator lifecycle and reset delivery.
- `backend/src/modules/projects`: membership-scoped records, assignments and status transitions.
- `backend/src/modules/auth`: validation, routes, service, session/permission middleware.
- `backend/src/shared`: database, HTTP errors, permission definitions.
- `backend/prisma`: schema, versioned migration and idempotent demo seed.
- `backend/tests`: PostgreSQL-backed integration tests.
- `e2e`: real browser workflows against the running application.

See [architecture](docs/PROJECT_ARCHITECTURE.md), [implementation plan](docs/IMPLEMENTATION_PLAN.md), [implemented business rules](docs/BUSINESS_RULES.md), [machine learning opportunities](docs/ML_OPPORTUNITIES.md), [open decisions](docs/OPEN_DECISIONS.md), and [status](PROJECT_STATUS.md).

The construction image is a cropped photo region from the user-supplied Visily PDF. Replace it with an appropriately licensed original before publishing the application. The logo SVG is local. No remote image or font fetch is required.

## Prerequisites

- Node.js 24 LTS and npm. The system Node on this machine is 26; local verification used the bundled Node 24 runtime. Use Node 24 for reproducible setup.
- PostgreSQL (verified locally with PostgreSQL 18).
- Microsoft Edge for local Playwright tests, or bundled Playwright Chromium in CI.
- Docker Compose is an alternative; Docker was not available for verification in this environment.

## Run on this machine

The application is configured, migrated, seeded and has a separate PostgreSQL cluster in `.local/postgres`, listening only on `127.0.0.1:55432`. Existing PostgreSQL installations/databases were not modified. Credentials are in ignored `backend/.env`; the local cluster password file is also ignored.

```powershell
cd C:\Users\Anushka\OneDrive\Desktop\Infosys
powershell -ExecutionPolicy Bypass -File scripts/start.ps1
```

Open **http://localhost:4200**. Use this hostname consistently because it is the configured origin for refresh/logout protection. Swagger: **http://localhost:4300/api/docs**.

The startup script uses hidden background processes, reuses healthy services, and waits for API/database and frontend readiness. Logs and new process IDs are written to `.local/`. It expects the already-built backend; after backend edits run `npm run build -w backend` and restart the API, or use development watch mode below.

## Fresh installation

```sh
npm ci --ignore-scripts
cp backend/.env.example backend/.env
# Set DATABASE_URL and a random JWT_SECRET (48+ characters).
# Create buildtrack and buildtrack_test in your development PostgreSQL instance.
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

On PowerShell use `Copy-Item backend/.env.example backend/.env`. `npm run db:generate` explicitly generates the Prisma client when installation scripts are disabled. Do not seed production. `DEMO_PASSWORD` must be a strong development password of at least 12 characters.

Frontend only: `npm start -w frontend` (port 4200). Backend watch: `npm run dev -w backend` (port 4300). Production builds: `npm run build`. Compiled backend: `npm start -w backend`.

### Demo credentials on this machine

All six seeded demo accounts currently use **`BuildTrackDemo2026!`**:

| Role            | Email                       |
| --------------- | --------------------------- |
| Administrator   | admin@buildtrack.local      |
| Project manager | manager@buildtrack.local    |
| Site engineer   | engineer@buildtrack.local   |
| Contractor      | contractor@buildtrack.local |
| Worker          | worker@buildtrack.local     |
| Client          | client@buildtrack.local     |

A fresh setup uses its own `DEMO_PASSWORD`. Repeat seeding preserves existing credentials and user changes. These accounts are for development only.

### Password-reset delivery

The current `MAIL_PROVIDER=local` writes reset messages to **`backend/.local/mail/*.json`**. Open the latest message for the requested account and use its link. Tokens are not returned by public APIs or served as static files. These local messages contain sensitive reset links and are git-ignored.

For real email set `MAIL_PROVIDER=smtp`, `SMTP_HOST`, `SMTP_PORT`, optional `SMTP_USER`/`SMTP_PASSWORD`, and `MAIL_FROM`. SMTP transport requires TLS. External email delivery has not been tested with a live provider.

## Environment settings

| Variable                  | Purpose                                              |
| ------------------------- | ---------------------------------------------------- |
| NODE_ENV                  | development, test or production                      |
| DATABASE_URL              | PostgreSQL connection URL                            |
| JWT_SECRET                | Random secret, at least 48 characters                |
| HOST / PORT               | Bind address and port; default 127.0.0.1:4300        |
| APP_ORIGIN                | Exact frontend origin; default http://localhost:4200 |
| MAIL_PROVIDER             | local or smtp                                        |
| SMTP_HOST / SMTP_PORT     | Mail server and TLS-capable port                     |
| SMTP_USER / SMTP_PASSWORD | Optional SMTP authentication                         |
| MAIL_FROM                 | Sender address                                       |
| DEMO_PASSWORD             | Development seed only                                |

Production refuses local mail and a non-HTTPS application origin. The local filesystem upload adapter is intended for development; production deployment requires durable object storage and a corresponding adapter.

## API and database

Database tables currently migrated: **organizations, users, auth_sessions, refresh_token_uses, password_reset_tokens, audit_logs, projects, project_members, work_items, site_reports, site_report_attachments, site_delays, inspections, equipment, equipment_allocations, maintenance_records, materials, material_requests, stock_movements, worker_profiles, worker_project_assignments, attendance, shifts, vendors, procurement_requests, purchase_orders, goods_receipts, invoices, budget_allocations, expenses, documents, document_versions, notifications**. Fourteen versioned migrations are applied. UUID identifiers, indexed relationships, timezone-aware timestamps and decimal money/rate fields are used. Roles are an enum; permissions are centralized code.

| Method      | Endpoint                                                        |
| ----------- | --------------------------------------------------------------- |
| GET         | /api/health, /api/ready                                         |
| POST        | /api/v1/auth/register, /login, /refresh, /logout                |
| POST        | /api/v1/auth/forgot-password, /reset-password, /change-password |
| GET / PATCH | /api/v1/auth/me                                                 |
| GET         | /api/v1/account/overview                                        |
| GET         | /api/v1/search                                                  |
| GET / POST  | /api/v1/users (organization administrator only)                 |
| PATCH       | /api/v1/users/:id                                               |
| POST        | /api/v1/users/:id/reset-password                                |
| GET         | /api/v1/users/roles                                             |
| GET / POST  | /api/v1/projects                                                |
| GET / PATCH | /api/v1/projects/:id                                            |
| PATCH       | /api/v1/projects/:id/status                                     |
| GET         | /api/v1/projects/team-options                                   |
| GET / POST  | /api/v1/projects/:id/schedule                                   |
| PATCH       | /api/v1/projects/:id/schedule/:itemId                           |
| GET         | /api/v1/projects/:id/site                                       |
| POST/PATCH  | /api/v1/projects/:id/site/reports, /delays, /inspections        |
| GET / POST  | /api/v1/equipment                                               |
| POST/PATCH  | /api/v1/equipment/:id/allocations, /maintenance                 |
| GET / POST  | /api/v1/inventory, /inventory/materials, /inventory/requests    |
| POST/PATCH  | /api/v1/inventory/materials/:id/adjust, /requests/:id/status    |
| GET         | /api/v1/workforce                                               |
| POST/PATCH  | /api/v1/workforce/workers, /assignments, /attendance, /shifts   |
| GET / POST  | /api/v1/procurement, /vendors, /requests, /orders, /invoices    |
| POST/PATCH  | /api/v1/procurement/orders/:id/receipts, invoice/request status |
| GET / POST  | /api/v1/finance, /finance/budgets, /finance/expenses            |
| GET / POST  | /api/v1/documents, /notifications                               |
| GET/DELETE  | /api/v1/documents/versions/:id/preview, /documents/:id          |
| GET         | /api/v1/reports/_.pdf, /reports/_.xlsx, /analytics              |
| POST        | /api/v1/assistant/public, /assistant/message                    |
| GET         | /api/v1/ml                                                      |

Abbreviated auth entries share `/api/v1/auth`. Interactive endpoint definitions are at `/api/docs`.

Frontend routes include authentication/account pages plus `/projects`, project schedule/site pages, `/equipment`, `/inventory`, `/workforce`, `/procurement`, `/finance`, `/documents`, `/analytics`, `/ml-insights`, and `/notifications`, each guarded by its server-matched permission.

## Current access matrix

| Role            | Team administration | Visible projects     | Create / edit / status                 | Site reports         | Equipment              |
| --------------- | ------------------- | -------------------- | -------------------------------------- | -------------------- | ---------------------- |
| Administrator   | Yes                 | Entire organization  | Yes                                    | Create/manage issues | View/allocate/maintain |
| Project manager | No                  | Assigned projects    | Create; assigned only for edits/status | View/manage issues   | View/allocate          |
| Site engineer   | No                  | Assigned projects    | Schedule updates only                  | Create/view          | View/allocate          |
| Contractor      | No                  | Assigned projects    | No                                     | Create/view          | View                   |
| Client          | No                  | Assigned projects    | No                                     | No                   | No                     |
| Worker          | No                  | Own workforce record | No                                     | No                   | No                     |

The API remains authoritative for organization ownership, project membership and action permission even when a frontend route is hidden.

## Testing

See [verification record](docs/VERIFICATION.md) for the latest executed checks.

Create `buildtrack_test` on the same development server before the first test run:

```sh
node scripts/prepare-test-db.cjs
npm test
npm test -w frontend
npm run lint
npm run build
# With frontend/backend running:
npm run test:e2e
```

Backend integration tests forcibly select the isolated `buildtrack_test` database and clear its application tables. They never clear the main development database. E2E tests create an isolated organization per workflow and remove its database records and uploaded fixture afterward.

The Angular 20 unit-test builder labels itself experimental. It runs Vitest/jsdom with zoneless TestBed configuration. This does not affect the production application build.

Security regression coverage includes role injection, cross-organization user listing, inactive accounts, wrong credentials, password hashing, profile persistence, refresh-cookie rotation/replay, origin checks, logout invalidation, uniform reset responses, concurrent reset consumption, expired tokens, password change, safe file uploads and audit data. ML coverage verifies training thresholds, learned risk separation, demand smoothing, cost regression, maintenance failure classification and role-scoped results. The complete local result is 27 backend integration/ML tests, 7 Angular unit tests and 20 Playwright workflows.

## Docker development

Copy root `.env.example` to `.env` and set the three values, then:

```sh
docker compose up --build
docker compose exec backend node dist/prisma/seed.js
```

Open http://localhost:4200. Compose uses an isolated PostgreSQL volume and a persistent local-data volume for development mail and uploads. The API is reached through Nginx, not published directly. Stop the local Angular server first if it already occupies port 4200. Docker configuration is supplied but **has not been executed here because Docker is unavailable on this host**.

## Deployment preparation

For a production release: build with Node 24, provision PostgreSQL and a least-privileged application user, set unique secrets, HTTPS APP_ORIGIN and a tested SMTP provider, run controlled migrations, place static Angular assets behind Nginx/TLS, proxy `/api`, and configure backups/log retention. Do not deploy demo accounts or development mail. Configure trusted proxies explicitly before exposing rate-limited APIs behind infrastructure. The supplied Compose file is a development configuration, not an audited production deployment.

## Known limitations

- Project progress uses explicit work-item weights and retains original schedule baselines. Inspection and delay corrections retain audit events but do not store field-level before/after snapshots, and stale project/team forms do not yet carry record versions.
- The six requested roles are fixed in the schema and permission map. Organization-defined custom roles are outside the current requirements.
- SMTP delivery has no durable outbox/retry queue. Development mail is file-backed.
- Local uploads are suitable for development. A production object-storage adapter, malware scanning and retention policy require a selected provider and credentials.
- Public signup creates an isolated client organization. The product policy for disabling public signup in favor of administrator-only onboarding remains configurable deployment work.
- Weather remains labeled demonstration data and cameras remain unconfigured until providers and credentials are selected. SMS is optional and unconfigured.
- Account timestamps use the browser timezone. Project schedule dates are PostgreSQL DATE values and are displayed as date-only UTC to prevent day shifts.
- Browser verification covers Edge desktop and 390px mobile emulation, not every browser/device.
- Docker and hosted CI have not been executed on this host. Production SMTP, object storage, live integrations, TLS, backups, monitoring and deployment need external infrastructure and credentials, so no production-readiness claim is made.
