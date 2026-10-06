# Verification record

Workspace: `C:/Users/Anushka/OneDrive/Desktop/Infosys`
Latest verification date: 2026-10-06
Runtime: bundled Node 24, Angular 20.3.33, Prisma 6.19.3, PostgreSQL 18, Microsoft Edge.

## Executed checks

- Backend TypeScript build: **passed**.
- Frontend production build: **passed** (368.46 KB initial raw bundle, 98.50 KB estimated transfer).
- Backend integration and ML unit suite: **27 passed**.
- Angular unit suite: **7 passed** across three files.
- Full Playwright suite: **20 passed** in one run (desktop plus 390px mobile coverage).
- ESLint: **passed** across application, seed and test code.
- Production dependency audit: **0 vulnerabilities** from `npm audit --omit=dev`.
- Prisma schema validation and migration status: **passed**; the development database is current.
- Fresh-database migration rehearsal: **passed**; all **14 migrations** applied to an empty isolated database and the database was removed afterward. Development and test databases are also current.
- Demo seed: **passed** and remains idempotent.

The integration and browser suites cover the public landing page, public and authenticated assistant modes, global search, authentication/session security, six-role access, invitation/forced-password behavior, pagination, administration, projects and closure, weighted dependency-aware scheduling and baselines, site reports/attachments/delays/inspections, historical equipment utilization, inventory, workforce, procurement, finance, versioned document upload/preview/download/delete, notifications, PDF/XLSX exports, analytics and ML Insights. ML tests verify training-data thresholds, schedule-risk separation, material-demand recency weighting, ridge-regression cost learning, equipment failure-signal learning and role-scoped access. They also cover refresh-family replay revocation, cross-organization authorization, receipt idempotency, stock movements, purchase/invoice bounds, expense state changes and final closure blockers.

## Visual review

Desktop captures were inspected for the landing page, workforce, procurement, finance, notifications, analytics and ML Insights. Project details, project lists and the 390px mobile shell were also inspected. Browser captures disable animation and reset scroll position before full-page screenshots.

## Issues resolved during verification

- Reset tests now select the current unused reset record instead of a stale local delivery file.
- The local startup script waits for database, API and frontend readiness and reports startup failures.
- Browser test isolation avoids shared authentication rate-limit state between clean full-suite runs.
- Document uploads enforce size, type and file-signature checks; internal storage paths are excluded from API responses.
- Dependency upgrades removed the production audit advisories introduced by PDF/XLSX and mail dependencies.
- Project closure now requires completed schedule work, resolved critical site findings, a versioned Contract or Handover document and settled finance/procurement records.
- Angular packages were aligned on 20.3.33 after the production dependency audit identified an advisory in 20.3.31; `npm audit --omit=dev` now reports zero vulnerabilities.
- The startup script locates either a root-hoisted or workspace-local Angular CLI and allows slower cold starts on the OneDrive-backed workspace.

## Scope and limitations

All twelve planned application milestones are implemented and verified locally. Docker configuration was inspected but could not be executed because Docker is unavailable on this host. Hosted CI, production SMTP, durable object storage, live weather/camera providers and production deployment were not executed. Local documents use the persisted development upload directory. Browser coverage uses Edge desktop and mobile emulation rather than every browser and device.

Commands are documented in the root README. Start local services before browser tests. Repeated full-suite runs within 15 minutes can reach the authentication rate limit; restart the development API for a clean test window.
