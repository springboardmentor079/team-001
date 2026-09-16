from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.base import Base
from app.database.session import engine
from app.api import auth, users
import app.models  # noqa: F401  (ensures all models are registered before create_all)

app = FastAPI(title=settings.APP_NAME, version="1.0.0")

# Allow the Angular dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)


@app.on_event("startup")
def on_startup():
    # Creates all tables if they don't exist yet (dev convenience;
    # use Alembic migrations for production schema changes).
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "BuildTrack API is running", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
