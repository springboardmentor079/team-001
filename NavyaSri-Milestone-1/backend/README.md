# BuildTrack Backend (Milestone 1)

FastAPI backend for the BuildTrack construction management platform.

## Stack

FastAPI · SQLAlchemy 2.0 · Alembic · Pydantic v2 · PostgreSQL (or SQLite for local dev) · JWT auth via `python-jose` · `passlib[bcrypt]` password hashing.

## Quick start (SQLite — zero setup)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and set:
# DATABASE_URL=sqlite:///./buildtrack.db

# Tables are also auto-created on startup when using SQLite, but running
# migrations is the recommended, production-like path:
alembic upgrade head

python seed_demo.py              # optional demo accounts + sample projects

uvicorn app.main:app --reload    # http://localhost:8000
```

Swagger docs: http://localhost:8000/docs · ReDoc: http://localhost:8000/redoc

## Quick start (PostgreSQL)

```bash
createdb buildtrack_db
cp .env.example .env
# Edit .env:
# DATABASE_URL=postgresql://username:password@localhost:5432/buildtrack_db

pip install -r requirements.txt
alembic upgrade head
python seed_demo.py
uvicorn app.main:app --reload
```

## Project layout

```
app/
  main.py            FastAPI app, CORS, error handlers, router registration
  core/               config.py (settings), security.py (JWT/bcrypt), dependencies.py (auth guards)
  database/           engine/session (database.py), declarative base (base.py)
  models/             one SQLAlchemy model module per table
  schemas/            Pydantic request/response models
  api/                routers: auth, users, projects, dashboard
  services/           business logic used by the routers
  utils/               small shared helpers
alembic/              migration environment + versions/0001_initial_schema.py
tests/                pytest suite (auth + password reset)
seed_demo.py          demo account + sample data seeder
```

## Running tests

```bash
pytest -v
```

## Demo accounts

See the root `README.md` for the full list of demo credentials (password: `Password123!`).
