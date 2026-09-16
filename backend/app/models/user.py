from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func

from app.database.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    # admin | project_manager | site_engineer | contractor | worker | client
    role = Column(String(30), nullable=False, default="worker")
    is_active = Column(Boolean, default=True)
    reset_token = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
