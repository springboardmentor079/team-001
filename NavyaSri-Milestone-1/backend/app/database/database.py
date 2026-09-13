"""
Database engine and session management.

Provides a SQLAlchemy engine configured from `DATABASE_URL`, a
`SessionLocal` factory, and a FastAPI dependency (`get_db`) that yields a
request-scoped session and guarantees it is closed afterwards.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# SQLite needs `check_same_thread=False` when used with FastAPI's threaded
# request handling. PostgreSQL does not need any special connect args.
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency that yields a database session per-request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
