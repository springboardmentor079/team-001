# BuildTrack — Requirements Document

## 1. Overview

BuildTrack is a full-stack construction project management and site monitoring platform for
construction companies, contractors, project managers, site engineers, workers, and clients.
This document describes the requirements delivered in **Milestone 1**.

## 2. Milestone 1 Scope

Milestone 1 establishes the application foundation:

- Project requirements and architecture documentation
- User roles and role-based access control (RBAC)
- Responsive authentication and dashboard UI
- Complete database schema for all planned modules
- FastAPI backend with JWT authentication
- Angular frontend skeleton with Angular Material + Bootstrap
- Role-based dashboards backed by real data

## 3. Functional Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| FR-1 | Users can register with full name, email, password, role, and phone number | Implemented |
| FR-2 | Users can log in with email/password and receive a JWT | Implemented |
| FR-3 | Users can request a password reset and set a new password | Implemented |
| FR-4 | Authenticated users can view and update their own profile | Implemented |
| FR-5 | Access to API endpoints and UI routes is restricted by role | Implemented |
| FR-6 | Each role has a dedicated dashboard showing role-relevant summary data | Implemented |
| FR-7 | Administrators can list, search, filter, and activate/deactivate users | Implemented |
| FR-8 | The database schema for projects is created and exposed read-only | Implemented |
| FR-9 | The database schema for resources (equipment) is created | Schema only — workflows in a later milestone |
| FR-10 | The database schema for inventory (materials) is created | Schema only — workflows in a later milestone |
| FR-11 | The database schema for workforce/workers is created | Schema only — workflows in a later milestone |
| FR-12 | The database schema for procurement is created | Schema only — workflows in a later milestone |
| FR-13 | The database schema for notifications is created | Schema only — service in a later milestone |
| FR-14 | The database schema for reports is created | Schema only — generation in a later milestone |

## 4. Non-Functional Requirements

- **Security** — Passwords are hashed with bcrypt; sessions use signed, time-limited JWTs;
  role checks are enforced server-side on every protected endpoint, not just in the UI.
- **Performance** — Endpoints use indexed lookups (email, role, foreign keys) and paginated
  list queries to remain responsive as data grows.
- **Scalability** — A layered backend (routers → services → ORM) and a modular Angular
  feature structure make it straightforward to add the remaining modules in later milestones
  without restructuring what already exists.
- **Maintainability** — Consistent naming, one model/schema per file, typed frontend models
  mirroring backend schemas, and inline documentation throughout.
- **Responsiveness** — All screens adapt from desktop down to mobile widths using a
  responsive sidenav, Bootstrap's grid utilities, and Angular Material's fluid form fields.
- **Usability** — Clear validation messages, loading states, and consistent success/error
  feedback (snackbars, inline alerts) throughout the authentication and dashboard flows.
- **Reliability** — Centralized exception handling returns consistent, predictable JSON
  error responses instead of raw stack traces.
- **Data integrity** — Foreign keys with explicit `ON DELETE` behavior, unique constraints
  (email, project code), and enum-constrained fields (role, status, category) at the
  database level.

## 5. Out of Scope for Milestone 1

The following are intentionally **not** implemented yet (their database schema exists, but
no CRUD workflows or business logic are built):

- Full project management (create/update/delete, milestone tracking UI)
- Resource allocation and equipment scheduling
- Inventory/material stock management
- Workforce assignment and attendance tracking
- Procurement request workflows
- Automated notifications
- Report generation
- Budget analytics and deployment analytics
