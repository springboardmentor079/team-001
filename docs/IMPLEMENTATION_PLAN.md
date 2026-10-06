# BuildTrack implementation phases

Follow the user's phase order. Each phase includes source inspection, backend, frontend, integration, applicable migration/seed, tests, builds, lint, and browser review. Do not proceed past unresolved major build errors. Do not label unimplemented modules as functional navigation destinations.

| Phase | Deliverable                                                                                                                                                | Verification gate                                                                                                                                    |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Repository baseline; architecture; tokenized responsive shell; Express/TypeScript/Prisma foundation; login/register/reset/logout/profile; session handling | Build/lint; auth unit and PostgreSQL integration tests; login/reset/logout browser flow; desktop/mobile auth and shell review                        |
| 2     | Six-role centralized permission model, admin management, role-aware dashboard framework                                                                    | Permission matrix tests including manipulated payloads and cross-organization access; role-specific UI visibility; only real available metrics shown |
| 3     | Projects, memberships, tasks, milestones, scheduling/dependencies, progress, details and controlled closure                                                | Create/update/assign/milestone workflows; scoped reads/writes; dependency/date validation; project UI tests                                          |
| 4     | Site daily/weekly reports, activities/feed, delays, inspections                                                                                            | Report persistence, attachments/scoping, progress updates and audit records                                                                          |
| 5     | Resources, allocation/release history, utilization, maintenance                                                                                            | Parallel allocation oversubscription tests, history retention, maintenance availability                                                              |
| 6     | Inventory, requests, allocation and stock movement/alerts                                                                                                  | Approved state transitions, nonnegative stock, concurrent allocation and transactional movement tests                                                |
| 7     | Workers, assignment, attendance, shifts, payroll monitoring                                                                                                | Duplicate attendance protection, overlapping shift rules, own-data restrictions, documented payroll estimates                                        |
| 8     | Vendors, requests, approvals, POs, partial receiving, invoices                                                                                             | Approval authority/state machine tests, idempotent receipts, line-item math and stock integration                                                    |
| 9     | Budgets, expenses, commitments, financial analytics                                                                                                        | Decimal calculations, currency validation, duplicate expense/source handling, scoped financial data                                                  |
| 10    | Notifications, documents/versions, report center, PDF/XLSX                                                                                                 | Real report data, download authorization, safe uploads, export validation and notification delivery                                                  |
| 11    | Cross-module analytics, documented operational insights, camera/weather adapters                                                                           | Metrics reconciled with database, date filters, demo/live labels, provider failures and unauthorized feed access                                     |
| 12    | Full regression, security/performance, Docker, CI, deployment documentation                                                                                | Complete demo E2E, responsive review, clean builds/tests/lint, migrations on fresh database, documented deployment limits                            |

## Phase 1 implementation sequence after repository selection

1. Record baseline Git changes and locate applicable instructions. Preserve user changes.
2. Reproduce existing frontend/backend startup and run existing tests without assuming they pass. Save concise baseline failures.
3. Preserve reusable Angular code and legacy APIs; add a separate TypeScript backend entry point during migration.
4. Add validated environment settings, API errors/envelopes, health/readiness, Prisma organization/user/role/session/reset/audit foundations, versioned migration, and explicit development-only seed.
5. Implement validated authentication with nonprivileged registration, reset delivery, session revocation, rate limits, server-derived identity/permissions and tests.
6. Connect Angular auth forms/guards/interceptor to the new API; add design tokens and a responsive shared shell with functional profile/logout. Keep operational dashboards for their phase.
7. Verify fresh database migration/seed; registration -> login -> protected profile -> refresh -> logout; reset expiry/single use and wrong-role/cross-user cases.
8. Review desktop/mobile screenshots and keyboard/focus behavior. Update status/README with actual commands and results.

## Migration and stopping conditions

Do not change a database of unknown ownership. Use an isolated development database and explicit data migration mapping. Do not remove Python/React code until migrated functionality has equivalent tests and the selected application is verified.

Repository choice is resolved: Desktop/Infosys. Phases 1–8 cover the secure foundation through procurement. Phase 9 adds category budgets, duplicate-safe expenses and reconciled commitments. Phase 10 adds versioned documents, recipient notifications, and database-backed PDF/XLSX exports. Phase 11 adds cross-module analytics with published calculations plus clearly labeled demo/unconfigured provider adapters. Phase 12 adds closure gates, dependency audit remediation, fresh-database migration verification, CI, Docker assets and final regression. All planned phases are implemented locally; external provider configuration and production deployment remain environment work.
