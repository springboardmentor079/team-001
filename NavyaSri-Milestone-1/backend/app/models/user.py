"""User model and role enumeration."""
import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class UserRole(str, enum.Enum):
    """All roles supported by the platform."""
    ADMIN = "ADMIN"
    PROJECT_MANAGER = "PROJECT_MANAGER"
    SITE_ENGINEER = "SITE_ENGINEER"
    CONTRACTOR = "CONTRACTOR"
    WORKER = "WORKER"
    CLIENT = "CLIENT"


class User(Base):
    """A platform user. Every authenticated principal has exactly one role."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, index=True)
    phone_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    profile_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships (back-populated from dependent modules; harmless for M1)
    managed_projects = relationship(
        "Project", foreign_keys="Project.project_manager_id", back_populates="project_manager"
    )
    client_projects = relationship(
        "Project", foreign_keys="Project.client_id", back_populates="client"
    )
    worker_profile = relationship("Worker", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")

    def __repr__(self) -> str:  # pragma: no cover - debugging helper only
        return f"<User id={self.id} email={self.email} role={self.role}>"
