"""
BuildTrack API — application entry point.

Configures the FastAPI app, CORS, exception handlers, and mounts all
Milestone 1 routers under the versioned `/api/v1` prefix.
"""
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import auth, dashboard, projects, users
from app.core.config import settings
from app.database.base import Base
from app.database.database import engine
from app.utils.helpers import error_response

# Import models so they are registered on Base.metadata before create_all().
from app import models  # noqa: F401

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "BuildTrack — Construction Project Management & Site Monitoring Platform.\n\n"
        "Milestone 1: authentication, role-based access control, and the "
        "foundational database schema."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
)

# ---------------------------------------------------------------------------
# CORS — allow the Angular dev server (and any configured origins) through.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Startup: create tables automatically when using SQLite for local/dev
# testing. When running against PostgreSQL in a real environment, use
# Alembic migrations (`alembic upgrade head`) instead — this call is a
# convenience no-op if the tables already exist.
# ---------------------------------------------------------------------------
@app.on_event("startup")
def on_startup() -> None:
    if settings.DATABASE_URL.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# Consistent error responses
# ---------------------------------------------------------------------------
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(str(exc.detail)),
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    messages = [f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in exc.errors()]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response("Validation failed.", {"errors": messages}),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):  # pragma: no cover
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response("An unexpected error occurred. Please try again later."),
    )


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Health"], summary="Application health check")
def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME, "environment": settings.ENVIRONMENT}


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(projects.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Health"], summary="API root")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs": "/docs",
        "health": "/health",
        "api_prefix": settings.API_V1_PREFIX,
    }
