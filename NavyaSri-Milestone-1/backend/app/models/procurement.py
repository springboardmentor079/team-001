"""Procurement request model."""
import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ProcurementCategory(str, enum.Enum):
    RAW_MATERIALS = "RAW_MATERIALS"
    EQUIPMENT = "EQUIPMENT"
    MACHINERY = "MACHINERY"
    SAFETY_EQUIPMENT = "SAFETY_EQUIPMENT"
    OFFICE_SUPPLIES = "OFFICE_SUPPLIES"


class ProcurementStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    ORDERED = "ORDERED"
    DELIVERED = "DELIVERED"
    REJECTED = "REJECTED"


class Procurement(Base):
    """A material/equipment procurement request tied to a project."""

    __tablename__ = "procurements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[ProcurementCategory] = mapped_column(Enum(ProcurementCategory), nullable=False)
    vendor_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    estimated_cost: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    actual_cost: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    status: Mapped[ProcurementStatus] = mapped_column(
        Enum(ProcurementStatus), nullable=False, default=ProcurementStatus.REQUESTED
    )
    request_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    expected_delivery_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    project = relationship("Project", back_populates="procurements")
