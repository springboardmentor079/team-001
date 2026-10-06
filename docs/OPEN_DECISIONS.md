# Open decisions and proposed defaults

These proposals make implementation choices visible; they are not approved business policy. Keep defaults in backend configuration/services and test their boundaries. Repository selection is resolved: Desktop/Infosys. Other decisions can use the stated conservative defaults during development.

| Decision                 | Proposed development default                                                                                    | Remaining decision                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Target repository        | Desktop/Infosys, selected by user                                                                               | Resolved; nearby repositories preserved                          |
| Backend/frontend         | Angular + Express/TypeScript + PostgreSQL + Prisma                                                              | Explicitly settled by latest request; migrate existing behavior  |
| Package manager/versions | Preserve working lockfile and compatible Angular major in selected source                                       | Verify runtime compatibility and dependencies during baseline    |
| Organization onboarding  | No joining organizations by typing their name; invited membership or isolated nonprivileged registration        | Self-service company setup vs administrator provisioning         |
| Roles                    | Six requested roles; named permissions for finance/procurement/supervisor duties                                | Confirm detailed permission matrix                               |
| Project visibility       | Membership required; client data requires explicit publication                                                  | Who can publish financial/report/document data                   |
| Procurement approvals    | Assigned project manager or administrator; separate approval event                                              | Monetary tiers, self-approval restrictions, delegation           |
| Payroll                  | Monitoring estimate only: approved hours x configured hourly rate                                               | Overtime, leave, deductions, statutory rules and currencies      |
| Project progress         | Explicit documented milestone weighting, with equal weighting only as visible initial default                   | Stage weights, report aggregation, manual override authority     |
| Health                   | Rule-based status using progress/schedule/budget/safety; expose reasons                                         | Exact thresholds/precedence, completed-project display           |
| Budget alerts            | Proposed warning 90%, critical 100% of budget utilization; forecast considered separately                       | Organization thresholds and commitment accounting                |
| Inventory                | Out of stock at zero; configurable critical and minimum levels per item                                         | Default critical ratio and stock reservation semantics           |
| Attendance               | One record per worker/project/work date with audited corrections                                                | Cross-midnight shift attribution, grace/late rules and time zone |
| Shift overlap            | Reject overlapping worker assignments unless explicitly permitted                                               | Exceptions and supervisor authority                              |
| Closure                  | Require completed milestones and no unresolved critical issues; explicit required-document and financial checks | Required documents and precise financial settlement rule         |
| File uploads             | Proposed 10 MB initial limit; allowlist PDF/JPEG/PNG/XLSX; authenticated downloads                              | CAD/supporting formats, malware scanning, retention              |
| Notification delivery    | In-app first; SMTP via configured provider/local development sink                                               | SMS opt-in, digest and escalation preferences                    |
| Storage                  | Local development; provider abstraction                                                                         | S3 or Cloudinary and production retention region                 |
| Camera                   | Configured source or clearly labeled Demo Feed                                                                  | Streaming provider, credentials, access and retention            |
| Weather                  | Provider adapter; labeled demo when unconfigured                                                                | Provider, API credentials, refresh and location policy           |
| Financial formatting     | Organization currency; INR only as an explicitly configured demo value                                          | Multi-currency/conversion support                                |
| Dates                    | UTC timestamps; display using organization/user time zone                                                       | Organization time zone; date-only schedule conventions           |
| Session                  | Proposed short access lifetime with revocable rotating refresh session                                          | Remember-me duration and concurrent-session limits               |

Detailed calculations will be written in `docs/BUSINESS_RULES.md` alongside their implementation, with actual configuration names and test cases. No hidden AI, live-camera, weather, payroll, or production-readiness claims are permitted.

## Current implementation choices (2026-10-06)

- Organization administrators manage member roles, access and reset requests. New members receive a one-time link through the configured mail provider and must change their temporary password before using workspace APIs.
- Assignment permits reading basic project information and roster; budget/estimate fields require BUDGET_VIEW. Admins see their entire organization; managers and other readers see assigned projects.
- Schedule dates use PostgreSQL DATE and UTC date-only rendering. Account timestamps still follow browser timezone.
- Project completion and closure require completed schedule work, no unresolved critical delay or failed/conditional inspection, a versioned Contract or Handover document for closure, and settled finance/procurement records.
- Project and team lists support bounded server-side pagination, filtering and allowlisted sorting. Version checks protect schedule/site/equipment/maintenance edits; stale project-detail and team-member forms remain a future hardening option.
