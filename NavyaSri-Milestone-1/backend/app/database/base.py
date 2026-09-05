"""
Declarative base for all SQLAlchemy ORM models.

Importing this module (and, transitively, `app.models`) ensures every model
is registered on `Base.metadata` before `create_all()` or Alembic's
autogenerate is invoked.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared declarative base class for all ORM models."""
    pass
