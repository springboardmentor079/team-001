# BuildTrack

Construction project management and site-monitoring platform.

## Milestone 1 setup

1. Create a PostgreSQL database and copy `backend/.env.example` to `backend/.env` with its connection URL and a strong `SECRET_KEY`.
2. In `backend`, create a virtual environment, install `pip install -r requirements.txt`, then run `alembic upgrade head` and `uvicorn app.main:app --reload`.
   Create the first administrator after migrating with `python -m app.scripts.create_admin --email admin@example.com --name "BuildTrack Admin"`; the command prompts securely for its password.
3. In `frontend`, run `npm install` then `npm start`. The Angular development server runs at `http://localhost:4200` and proxies `/api` to FastAPI.

Design requirements, user flows, wireframe inventory, roles and the finalized schema are in [docs/milestone-1-design.md](docs/milestone-1-design.md).
