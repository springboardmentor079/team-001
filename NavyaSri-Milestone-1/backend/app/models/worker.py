"""Worker (workforce) model. Distinct from `User` — this holds employment
details for users whose role is WORKER, CONTRACTOR, SITE_ENGINEER, etc."""
import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class WorkerCategory(str, enum.Enum):
    ENGINEERS = "ENGINEERS"
    SUPERVISORS = "SUPERVISORS"
    CONTRACTORS = "CONTRACTORS"
    SKILLED_WORKERS = "SKILLED_WORKERS"
    UNSKILLED_WORKERS = "UNSKILLED_WORKERS"
    CONSULTANTS = "CONSULTANTS"


class WorkerStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ON_LEAVE = "ON_LEAVE"
    RELEASED = "RELEASED"


class Worker(Base):
    """Employment/workforce record linked one-to-one with a `User`."""

    __tablename__ = "workers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    worker_category: Mapped[WorkerCategory] = mapped_column(Enum(WorkerCategory), nullable=False)
    skill: Mapped[str | None] = mapped_column(String(150), nullable=True)
    assigned_project_id: Mapped[int | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )
    joining_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[WorkerStatus] = mapped_column(
        Enum(WorkerStatus), nullable=False, default=WorkerStatus.ACTIVE
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="worker_profile")
    project = relationship("Project", back_populates="workers")
    attendance_records = relationship(
        "Attendance", back_populates="worker", cascade="all, delete-orphan"
    )
