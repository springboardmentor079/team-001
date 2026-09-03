"""
BuildTrack FastAPI application entry point.
"""
import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.core.config import get_settings

# Import all ORM models so Base.metadata is fully populated
import app.models  # noqa: F401

# Import router modules directly (not via package alias)
import app.routers.auth     as _auth_mod
import app.routers.users    as _users_mod
import app.routers.projects as _projects_mod
import app.routers.tasks    as _tasks_mod

settings = get_settings()
logger = logging.getLogger("buildtrack")

# ── Application ───────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "BuildTrack — Construction Project Management & Site Monitoring Platform.\n\n"
        "Milestone 1: User authentication, project management, and task tracking."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(_auth_mod.router)
app.include_router(_users_mod.router)
app.include_router(_projects_mod.router)
app.include_router(_tasks_mod.router)


# ── Global exception handlers ─────────────────────────────────────────────────
@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred."},
    )


# ── Startup event ─────────────────────────────────────────────────────────────
# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"], summary="API health check")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
