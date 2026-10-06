# Implemented foundation rules

This file documents rules that currently exist in code. Planned operational rules remain in OPEN_DECISIONS.md until implemented.

## Accounts and organizations

- Public registration accepts name, email, company, optional phone, and password only. Unknown fields are rejected.
- Registration always creates a CLIENT user and a new isolated organization, even if another organization has the same display name. A company name is never sufficient to join it.
- Email addresses are normalized to lowercase and globally unique in this initial identity model. Multi-organization membership per identity is a future decision.
- Demo seeding creates one organization and six roles. Existing seed users are not overwritten on repeat runs. Demo seed is disabled for NODE_ENV=production.
- Roles are an enum and permissions are centralized in backend/src/shared/permissions.ts. Database-managed roles/permissions are a later phase.
- Organization currency/time zone defaults are INR and Asia/Kolkata. They are returned from the database, not hardcoded in page templates.

## Credentials and sessions

- New passwords require 12-72 characters, at least one uppercase letter, one lowercase letter and one digit, with a maximum of 72 UTF-8 bytes to avoid bcrypt truncation. Bcrypt cost is 12.
- Access JWTs expire after 15 minutes and include a session identifier. Every protected request verifies the signature, issuer, audience, active user and nonrevoked session against the database.
- Refresh credentials are random 256-bit values stored as SHA-256 hashes. Refresh rotates the hash with a conditional update, so a stale credential cannot be reused. A rejected replay does not currently revoke the entire session family.
- A session lasts 12 hours normally, or 7 days with Keep me signed in. Current implementation uses an expiry cookie for both; unchecked does not mean browser-close-only persistence.
- Refresh cookies are HTTP-only, SameSite=Strict, scoped to /api/v1/auth, and Secure in production. Access tokens live in Angular memory, not localStorage.
- Refresh/logout require the configured Origin and X-BuildTrack-Client: web. CORS allows the configured application origin only.
- Logout revokes the current session. Password reset/change revokes all sessions. A current password is required to change it.
- Reset links expire after 30 minutes and can be consumed once, enforced by a conditional update inside the password transaction. A new reset request invalidates prior unused reset credentials.
- Known and unknown reset requests receive the same public response, without a token. Development writes mail messages into backend/.local/mail. SMTP is used only when configured. Delivery failure invalidates the token and records a generic server error; delivery queues/retries are not implemented yet.
- Auth endpoints share a 60 requests / 15 minutes / IP limiter in production, 300 in development so the full local browser suite can run, and 1000 in isolated integration tests. JSON bodies are limited to 32 KB.

## Access and audit

- The account overview contains only the authenticated user's session count and latest eight audit events, scoped to their organization and identity.
- Team directory requires USER_MANAGE and filters users by the administrator's organization. It returns organization members alphabetically, including inactive users and last login. Administrators can create and edit members, assign roles, change active status, and request password resets.
- Profile edits can change only name and phone; role/email/company cannot be injected through that endpoint.
- Registration, login, logout, profile changes and password updates create audit records. No password or raw token is included in an audit entry.
- Administrators cannot deactivate or demote themselves. Organization-row locking and rechecking the acting administrator serialize competing access changes, preserving an active administrator. Role/email/access changes revoke affected sessions and outstanding reset tokens.
- Initial passwords use the same validation and hashing policy as registration. No administrator password retrieval exists. Reset requests use the configured mail provider, are audited, and are limited to 20 requests per 15 minutes per IP.

## Project records

- Administrators can view every project in their organization. All other authorized roles require explicit project membership. Workers lack general PROJECT_VIEW; a linked worker account reads only its own workforce records. Project managers can create projects and edit/transition projects they are assigned to.
- Project codes are unique within an organization. New projects start in Planning. The creator/editor is automatically retained in the assignment list. Other assigned users must be active members of the same organization.
- Dates must be valid ISO dates, with end date on or after start date. Budget and estimated cost are nonnegative decimal strings with at most two fractional digits, stored as Decimal(16,2). APIs omit both fields unless the caller has BUDGET_VIEW.
- Allowed transitions: Planning → Active/Cancelled; Active → On Hold/Delayed/Completed/Cancelled; On Hold → Active/Cancelled; Delayed → Active/On Hold/Completed/Cancelled; Completed → Active/Closed. Closed and Cancelled are terminal and cannot be edited.
- Status is an audited manual declaration. There is no computed progress, milestone gating, financial settlement check or automatic delay detection yet. These remain necessary before production use of project closure.
- Details, member assignments and status writes are transactional and audited. Project-row locks serialize edits/status changes. Last-write-wins still applies to stale client forms.
- Search matches name, code or city; status filtering is exact. Project/team list pagination remains pending.
- Expense APIs do not yet exist. Permission constants are not evidence that those operations are implemented.

## Schedule and site operations

- Schedule dates must remain inside project dates. Dependencies must belong to the same project, cannot form cycles, and must be due before a dependent starts. Progress cannot begin before the dependency completes.
- Not-started items require 0%; completed items require 100% and an actual completion date no later than today. Optimistic versions prevent stale schedule, report, delay and inspection updates.
- Project progress uses an equal-weight average of milestones. If no milestone exists, it uses all tasks. The API states the basis; no hidden weighting is applied.
- Completing or closing a project requires at least one milestone, every schedule item completed, no unresolved critical delay, and no unresolved failed/conditional inspection. Closing additionally requires a versioned Contract/Handover document and no pending expenses, unsettled invoices, open purchase orders or pending procurement approvals.
- One daily report per author, project and date is allowed. Only the author or an administrator can correct it. Site dates cannot predate project start or be in the future.

## Equipment

- Equipment codes are unique per organization. Allocation writes lock the equipment row, reject overlapping unreleased time ranges and reject conflicts with active maintenance.
- Operators, when supplied, must be active members of the allocated project. Allocation permission also requires access to that project.
- Releasing an allocation retains its record and timestamp. Maintenance history is retained. Maintenance cannot be scheduled inside an unreleased allocation, and final maintenance records cannot be reopened.
- Current utilization is `In Use units / total active units × 100`, rounded to an integer. Historical time-based utilization is not implemented yet.

## Inventory

- Available stock is current stock minus allocated stock. Status is Out of Stock at zero, Critical at or below the configured critical level, Low Stock at or below minimum, otherwise Healthy.
- Material creation and every adjustment create a stock movement. Adjustments lock the material row and cannot reduce current stock below zero or below already allocated stock.
- Requests follow Draft → Submitted → Approved → Allocated → Fulfilled, with rejection from Submitted/Approved and release from Allocated back to Approved. Other transitions are rejected.
- Allocation locks the material row and rejects quantities above available stock. Fulfilment atomically reduces current and allocated stock. Movements retain balance and allocated balance after each transaction.

## Workforce

- Employee IDs are unique per organization. A profile may optionally link to one login account; linked worker accounts receive only their own workforce dashboard records.
- Attendance and shifts require an active project assignment covering the date. One attendance record is allowed per worker, project and day. Future attendance, hours above 24, and nonzero hours for Absence/Leave are rejected.
- Shift creation locks the worker row and rejects any time overlap, including overlap across different projects. A shift cannot exceed 24 hours and must begin within project dates.
- Payroll monitoring is an operational estimate: approved attendance hours multiplied by the worker's current hourly rate. It is not a payroll ledger, payslip, tax calculation or payment record.

## Procurement

- Requests require project access and an organization material. Only PO_APPROVE roles can approve or reject submitted requests; only approved requests can become purchase orders.
- Purchase-order subtotal is quantity × unit price. Tax is subtotal × tax rate / 100; both values are rounded to two decimals and stored with the total.
- Goods receipts lock the organization, order and material rows. An organization-scoped idempotency key returns the existing receipt instead of adding stock twice. Partial receipts cannot exceed the ordered quantity and each accepted receipt creates a stock movement.
- Invoice totals cannot exceed the purchase-order total. Invoice states follow Submitted → Verified → Paid, with Disputed available from Submitted/Verified and resubmission from Disputed.

## Finance

- Category allocations are serialized against the project row and cannot exceed the project budget in total. Expenses must use the organization's currency, fall within project dates through today, and have an organization-unique source reference when supplied.
- Expense states follow Submitted → Approved/Rejected and Approved → Paid. Actual cost is approved/paid expenses plus paid invoices. Outstanding commitment is non-cancelled purchase-order total minus paid invoices; forecast is actual plus outstanding commitment.

## Documents, notifications and reports

- Files are limited to 10 MB and PDF, PNG, JPEG, XLSX or DOCX. Both declared MIME type and file signature are checked. Server-generated storage names prevent path traversal; storage paths never appear in API responses.
- Document versions are serialized by locking the document row. Downloads re-check organization and project visibility. Uploads notify other assigned project members.
- PDF and XLSX exports are generated from current authorized database records. The XLSX route additionally requires REPORT_EXPORT.

## Analytics and integrations

- Project progress uses the published schedule rule. Risk adds 12 points per overdue item, 25 per critical delay, 20 per unresolved failed/conditional inspection and 20 when forecast reaches 90% of budget, capped at 100.
- Weather responses are explicitly labeled demonstration data while no provider is configured. Camera responses return no image or stream and state that the provider is unconfigured.
