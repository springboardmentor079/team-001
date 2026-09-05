# BuildTrack — Construction Project Management & Site Monitoring Platform

**Milestone 1**: Requirements & architecture, database design, JWT authentication,
role-based access control, and a working Angular + FastAPI application skeleton.

---

## 1. Project Overview

BuildTrack is a full-stack platform for construction companies, contractors, project
managers, site engineers, workers, and clients to manage construction projects, monitor
site progress, track resources, manage budgets, coordinate teams, and generate reports
from a centralized platform.

## 2. Milestone 1 Scope

- Project requirements and architecture documentation (`docs/`)
- User roles and role-based access control (6 roles)
- Responsive authentication and dashboard UI
- Complete database schema for all 10 planned tables
- FastAPI backend: JWT auth, RBAC, profile management, admin user management,
  role-based dashboard summaries
- PostgreSQL database configuration (with an SQLite fallback for zero-setup local dev)
- Angular 17 frontend skeleton with Angular Material + Bootstrap, wired end-to-end to
  the backend

Full project/resource/inventory/workforce/procurement/notification/reporting **workflows**
are out of scope for Milestone 1 — their database tables exist, but only authentication,
RBAC, and role-based dashboards are functionally complete. See `docs/requirements.md`
for the full breakdown.

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17, TypeScript, Angular Material, Bootstrap 5, RxJS |
| Backend | Python, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, Uvicorn |
| Database | PostgreSQL (SQLite supported for local development) |
| Auth | JWT (python-jose), OAuth2 password flow, bcrypt (passlib) |

## 4. Project Structure

```
BuildTrack-Milestone-1/
├── README.md                  ← you are here
├── docker-compose.yml
├── .gitignore
├── docs/                      ← requirements, roles, flows, schema, wireframes, architecture
├── backend/                   ← FastAPI application
│   ├── app/
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   ├── .env.example
│   ├── Dockerfile
│   ├── seed_demo.py
│   └── README.md
└── frontend/                  ← Angular application (buildtrack-frontend)
    ├── src/
    ├── package.json
    ├── angular.json
    ├── Dockerfile
    └── README.md
```

## 5. Prerequisites

- **Python** 3.11+ and `pip`
- **Node.js** 18+ and `npm`
- **PostgreSQL** 14+ (optional for local dev — SQLite works out of the box)
- (Optional) **Docker** and **Docker Compose**

## 6. Quick Start — Without Docker

### 6.1 Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# For zero-setup local testing, edit .env and set:
#   DATABASE_URL=sqlite:///./buildtrack.db
# For PostgreSQL, first create the database:
#   createdb buildtrack_db
# then set DATABASE_URL=postgresql://username:password@localhost:5432/buildtrack_db

alembic upgrade head                # 6.10 Database migration
python seed_demo.py                 # 6.11 Demo data setup
uvicorn app.main:app --reload       # 6.12 Running backend → http://localhost:8000
```

### 6.2 Frontend

```bash
cd frontend
npm install
npm start                            # 6.13 Running frontend → http://localhost:4200
```

### 6.3 API Documentation

- Swagger UI: **http://localhost:8000/docs**
- ReDoc: **http://localhost:8000/redoc**

## 7. Quick Start — With Docker

```bash
docker-compose up --build
```

This starts PostgreSQL, runs migrations + the demo seed, and starts both the backend
(`http://localhost:8000`) and frontend (`http://localhost:4200`) containers.

## 8. Demo Credentials

Seeded by `backend/seed_demo.py`. **Development credentials only — change or remove
before any production or shared deployment.**

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@buildtrack.com` | `Password123!` |
| Project Manager | `manager@buildtrack.com` | `Password123!` |
| Site Engineer | `engineer@buildtrack.com` | `Password123!` |
| Contractor | `contractor@buildtrack.com` | `Password123!` |
| Worker | `worker@buildtrack.com` | `Password123!` |
| Client | `client@buildtrack.com` | `Password123!` |

## 9. Running Tests

```bash
cd backend
pytest -v
```

Covers registration, duplicate-email validation, login (valid/invalid), JWT-protected
routes, role-based authorization, and the password reset flow.

## 10. Screenshots

_Placeholders — add screenshots here after running the application locally:_

- `docs/screenshots/login.png`
- `docs/screenshots/register.png`
- `docs/screenshots/admin-dashboard.png`
- `docs/screenshots/project-manager-dashboard.png`
- `docs/screenshots/profile.png`

## 11. Documentation Index

| Document | Contents |
|---|---|
| [`docs/requirements.md`](docs/requirements.md) | Functional & non-functional requirements |
| [`docs/user-roles.md`](docs/user-roles.md) | Roles and the permission matrix |
| [`docs/user-flow.md`](docs/user-flow.md) | Registration, login, password reset flows |
| [`docs/navigation-structure.md`](docs/navigation-structure.md) | Route table and sidebar navigation per role |
| [`docs/database-schema.md`](docs/database-schema.md) | All 10 tables + Mermaid ER diagram |
| [`docs/ui-wireframes.md`](docs/ui-wireframes.md) | Screen-by-screen UI structure |
| [`docs/architecture.md`](docs/architecture.md) | System, backend, and frontend architecture |

## 12. Future Milestones

The following modules have their database schema ready but no workflows yet — planned
for later milestones:

- Full project management (create/update/delete, milestone tracking UI)
- Resource allocation & equipment scheduling
- Inventory/material stock management
- Workforce assignment & attendance tracking
- Procurement request workflows
- Automated notifications
- Report generation
- Budget & deployment analytics

## 13. License

Internal evaluation / educational project. Not licensed for production/commercial use as-is.
