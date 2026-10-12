# BuildTrack analytics implementation report

## Delivered charts

- Workspace dashboard: recorded completion line, project-status doughnut, and project completion versus rule-risk bars.
- Analytics & Insights: cumulative actual expenditure versus the current approved budget ceiling, recorded completion, approved workforce attendance, equipment allocation utilisation, and procurement activity lines.
- Analytics & Insights: project completion/risk and approved-budget/actual-expenditure comparison bars.
- Analytics & Insights: project, procurement, and equipment status doughnuts.
- Every chart includes an accessible text description, native SVG point/bar tooltips, a legend, an empty state, and an expandable data table.

## Data and formulas

- Current completion: weighted average of persisted milestone progress; tasks are used when no milestones exist.
- Completion trend: dated `SiteReport.reportedProgress` observations. Missing intervals remain null.
- Actual expenditure: approved or paid expenses plus paid invoices, each included once.
- Budget utilisation: actual expenditure divided by approved project budget.
- Commitment: non-cancelled purchase-order total minus paid invoices, floored at zero.
- Current resource utilisation: active equipment in `IN_USE` or `RESERVED` divided by active equipment.
- Historical equipment utilisation: allocation overlap days divided by available equipment-days for the interval.
- Workforce trend: distinct workers with approved `PRESENT` or `HALF_DAY` attendance and their approved hours.
- Pending procurement: persisted requests in `SUBMITTED` or `APPROVED`.
- Overdue delivery: non-cancelled, non-received purchase order whose expected date is before the report end date.
- Rule risk: 12 points per overdue work item, 25 per critical open delay, 20 per unresolved failed/conditional inspection, and 20 when budget exposure reaches 90%; capped at 100.

All calculations use the signed-in user's organisation and permitted-project scope. Training-only projects remain excluded from operational charts.

## API

`GET /api/v1/analytics` now accepts validated `start`, `end`, `projectId`, `status`, and `interval=week|month` query parameters. It returns reporting metadata, KPI values, chart-ready series, traceable rule findings, methodology descriptions, and predictive-readiness information. The existing `REPORT_VIEW` permission and project membership scope remain enforced. Date ranges are limited to five years.

`GET /api/v1/account/overview` now includes compact chart series derived from the same persisted project, schedule, and site-report records used by the workspace dashboard.

## Downloadable PDF

`GET /api/v1/reports/project-summary.pdf` now produces a two-page project analytics report with operational and permission-aware financial KPIs. Its visual analytics page contains a line chart from dated site-report progress, horizontal progress bars from saved milestones or work items, and a doughnut chart from the mutually exclusive work-item statuses. Empty or missing histories are identified instead of interpolated. Users without `BUDGET_VIEW` receive a restricted finance section rather than financial values.

## ML limitations and controls

The existing schedule-delay, cost-at-completion, and equipment-failure candidates currently have in-sample diagnostics only. They are now marked `RESEARCH_ONLY`; operational probabilities and cost predictions are withheld until project-level or time-based holdout evaluation and probability calibration are available. The UI states this explicitly. Rule-based findings are labelled `RULE BASED` and never presented as ML.

The material-demand calculation remains an exponentially weighted forecast over persisted outbound stock-movement weeks. Equipment service dates remain deterministic interval baselines when a validated failure model is unavailable.

## Verification

- Production frontend and backend build passed.
- ESLint and TypeScript checks passed.
- Backend suite: 27 tests passed.
- Frontend suite: 7 tests passed.
- Downloadable project analytics PDF rendered as two pages and was visually inspected.
- Playwright regression: 20 tests passed, including analytics charts, filters, source records, authentication, roles, finance, procurement, inventory, equipment, workforce, and mobile overflow.
- Desktop and 390 px mobile screenshots were visually inspected.
