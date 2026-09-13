"""Generated report metadata model."""
import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ReportType(str, enum.Enum):
    PROGRESS = "PROGRESS"
    FINANCIAL = "FINANCIAL"
    RESOURCE = "RESOURCE"
    SAFETY = "SAFETY"
    CUSTOM = "CUSTOM"


class Report(Base):
    """Metadata for a generated project report/document."""

    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    report_type: Mapped[ReportType] = mapped_column(
        Enum(ReportType), nullable=False, default=ReportType.CUSTOM
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    generated_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="reports")
