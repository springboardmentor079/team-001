# BuildTrack — User Roles & Permissions

BuildTrack defines six roles. Every user has exactly one role, stored on the `users.role`
column and embedded as a claim in their JWT access token.

## Role Summary

| Role | Description | Milestone 1 Access |
|------|-------------|---------------------|
| **Administrator** (`ADMIN`) | Owns the platform. Manages users and has visibility into all projects. | Admin dashboard, full user management (list/search/filter/activate/deactivate), all projects (read-only) |
| **Project Manager** (`PROJECT_MANAGER`) | Manages one or more construction projects end-to-end. | PM dashboard, projects they manage (read-only) |
| **Site Engineer** (`SITE_ENGINEER`) | Oversees day-to-day activity on an active construction site. | Site Engineer dashboard, active projects (read-only) |
| **Contractor** (`CONTRACTOR`) | An external/internal contracting party assigned work on a project. | Contractor dashboard, active projects (read-only) |
| **Worker** (`WORKER`) | On-site labor assigned to a project. | Worker dashboard |
| **Client** (`CLIENT`) | The project owner/customer tracking progress on their commissioned project(s). | Client dashboard, their own project(s) (read-only) |

## Permission Matrix (Milestone 1)

| Action | Admin | Project Manager | Site Engineer | Contractor | Worker | Client |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Register / Login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View / edit own profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own role dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| List / search all users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Activate / deactivate a user | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View all projects | ✅ | Managed only | All (read-only) | All (read-only) | — | Own only |
| Change another user's role | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Enforcement

Role checks are enforced in two layers, and the backend is the authority — the frontend
guard only improves UX by hiding routes/links the user can't use.

1. **Backend** — the `require_roles([...])` FastAPI dependency (see
   `backend/app/core/dependencies.py`) rejects any request from a user whose role isn't in
   the allowed set with an HTTP `403 Forbidden`.
2. **Frontend** — the Angular `roleGuard` (see `frontend/src/app/core/guards/role.guard.ts`)
   reads `data.roles` from the matched route and redirects to `/unauthorized` if the signed-in
   user's role isn't permitted, and the sidebar only renders links relevant to the current role.
