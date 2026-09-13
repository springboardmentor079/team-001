"""Project model and related enumerations."""
import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ProjectCategory(str, enum.Enum):
    RESIDENTIAL = "RESIDENTIAL"
    COMMERCIAL = "COMMERCIAL"
    INDUSTRIAL = "INDUSTRIAL"
    INFRASTRUCTURE = "INFRASTRUCTURE"
    GOVERNMENT = "GOVERNMENT"


class ProjectStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Project(Base):
    """A construction project. Full CRUD workflows arrive in a later milestone."""

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_name: Mapped[str] = mapped_column(String(200), nullable=False)
    project_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[ProjectCategory] = mapped_column(Enum(ProjectCategory), nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expected_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    budget: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus), nullable=False, default=ProjectStatus.PLANNED
    )
    project_manager_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    client_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    project_manager = relationship(
        "User", foreign_keys=[project_manager_id], back_populates="managed_projects"
    )
    client = relationship("User", foreign_keys=[client_id], back_populates="client_projects")
    milestones = relationship(
        "ProjectMilestone", back_populates="project", cascade="all, delete-orphan"
    )
    resources = relationship("Resource", back_populates="project")
    workers = relationship("Worker", back_populates="project")
    procurements = relationship(
        "Procurement", back_populates="project", cascade="all, delete-orphan"
    )
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan")
    attendance_records = relationship(
        "Attendance", back_populates="project", cascade="all, delete-orphan"
    )
