# BuildTrack — Architecture

## 1. High-Level Architecture

```
┌─────────────────────────┐        HTTPS / JSON        ┌──────────────────────────┐
│   Angular 17 Frontend    │ ─────────────────────────▶ │     FastAPI Backend      │
│  (buildtrack-frontend)   │ ◀───────────────────────── │        (app/)            │
│                           │      JWT Bearer token       │                          │
│  Standalone components    │                              │  Routers → Services →   │
│  Reactive Forms + RxJS    │                              │  SQLAlchemy ORM Models  │
│  Angular Material + Boot- │                              │                          │
│  strap grid utilities     │                              │                          │
└─────────────────────────┘                              └────────────┬─────────────┘
                                                                          │
                                                                          ▼
                                                              ┌───────────────────┐
                                                              │ PostgreSQL (or     │
                                                              │ SQLite for local   │
                                                              │ dev/testing)       │
                                                              └───────────────────┘
```

## 2. Backend Architecture

The backend follows a layered structure so business logic stays independent of both the
HTTP layer and the ORM:

- **`app/api/`** — FastAPI routers. Parse/validate the request (via Pydantic), call into a
  service, and shape the HTTP response. No business logic lives here.
- **`app/services/`** — Business logic (e.g. `auth_service.register_user`,
  `user_service.set_user_active_status`). Independently testable and reusable.
- **`app/models/`** — SQLAlchemy 2.0 declarative ORM models, one file per table, with
  relationships wired up for the future modules.
- **`app/schemas/`** — Pydantic request/response models, decoupled from the ORM models so
  the API contract can evolve independently of the database schema.
- **`app/core/`** — cross-cutting concerns: `config.py` (typed settings from environment
  variables), `security.py` (bcrypt hashing, JWT signing/verification), `dependencies.py`
  (current-user resolution and the `require_roles()` authorization guard).
- **`app/database/`** — the SQLAlchemy engine/session (`database.py`) and the shared
  declarative `Base` (`base.py`).

Every protected endpoint depends on `get_current_active_user` (or `require_roles([...])`),
which decodes the bearer JWT, loads the corresponding user, and rejects the request with
`401`/`403` before any handler code runs.

## 3. Frontend Architecture

The Angular app uses standalone components (no `NgModule`s) with a feature-folder structure:

- **`core/`** — singletons used app-wide: `AuthService` (session state + localStorage
  persistence), `UserService`, `DashboardService`, `ApiService` (thin `HttpClient` wrapper
  that unwraps the backend's `{success, message, data}` envelope), route guards
  (`authGuard`, `roleGuard`), and the `authInterceptor` functional HTTP interceptor that
  attaches the JWT to every request and handles `401` responses globally.
- **`shared/`** — presentational components reused across features: `navbar`, `sidebar`
  (role-aware navigation), `loading`, `unauthorized`, `stat-card`.
- **`features/`** — one folder per screen/domain: `auth/*`, `dashboard/*` (plus a shared
  `DashboardLayoutComponent` shell), `profile/`, `projects/`, `admin/users-list/`, and
  `coming-soon/` for not-yet-built modules.

Routes are lazy-loaded (`loadComponent`) and guarded declaratively via route `data.roles`,
keeping the route table itself the single source of truth for what each role can reach.

## 4. Authentication & Authorization Flow

1. `POST /api/v1/auth/register` creates a `users` row with a bcrypt-hashed password.
2. `POST /api/v1/auth/login` verifies the password and returns a JWT whose payload contains
   `sub` (user id), `email`, and `role`, signed with `SECRET_KEY` (`HS256`) and expiring
   after `ACCESS_TOKEN_EXPIRE_MINUTES`.
3. The Angular `AuthService` stores the token and user object in `localStorage` so a page
   refresh doesn't lose the session, and exposes the current user as an observable.
4. The `authInterceptor` attaches `Authorization: Bearer <token>` to every outgoing API
   request automatically.
5. On the backend, `get_current_user` decodes the token and loads the user; `require_roles`
   layers a role check on top. On the frontend, `authGuard` blocks unauthenticated access to
   the app shell, and `roleGuard` blocks role-mismatched access to a specific route.

## 5. Database Design Principles

- One table per domain entity (see `docs/database-schema.md`), with enum-constrained
  category/status columns to keep data consistent.
- Foreign keys use `ON DELETE CASCADE` where a child record is meaningless without its
  parent (e.g. `project_milestones.project_id`), and `ON DELETE SET NULL` where the
  relationship is an assignment that can be cleared (e.g. `projects.project_manager_id`).
- Alembic manages schema evolution; the Milestone 1 migration
  (`0001_initial_schema.py`) creates every table so later milestones only need to add
  incremental migrations, not redesign the schema.

## 6. Deployment

- **Local, no Docker** — run PostgreSQL (or use SQLite) + `uvicorn` for the backend and
  `ng serve` for the frontend, as described in each package's README.
- **Docker Compose** — `docker-compose.yml` at the repository root brings up `postgres`,
  `backend`, and `frontend` together for a one-command local environment.
- **CORS** — the backend's `BACKEND_CORS_ORIGINS` setting explicitly allow-lists the
  Angular dev server origin(s) so the two apps can run on separate ports during development.
