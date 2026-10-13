import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.base import Base
from app.database.session import engine
from app.api import (
    auth,
    users,
    projects,
    resources,
    workforce,
    procurement,
    notifications,
    reports,
    documents,
    expenses,
    vendors,
    shifts,
)
import app.models  # noqa: F401  (ensures all models are registered before create_all)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Dev convenience. In production set AUTO_CREATE_TABLES=false and run `alembic upgrade head`.
    if settings.AUTO_CREATE_TABLES:
        Base.metadata.create_all(bind=engine)
    if settings.SEED_DEMO_DATA:
        try:
            from app.seed import main as seed_demo_data

            seed_demo_data()  # idempotent: does nothing if the demo data is already there
        except Exception:  # never stop the API from starting because of the seeder
            logging.getLogger("buildtrack").exception("Demo data seeding failed")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.1.0",
    description="BuildTrack - Construction Project Management & Site Monitoring API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(resources.router)
app.include_router(workforce.router)
app.include_router(procurement.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(documents.router)
app.include_router(expenses.router)
app.include_router(vendors.router)
app.include_router(shifts.router)


@app.get("/")
def root():
    return {"message": "BuildTrack API is running", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
