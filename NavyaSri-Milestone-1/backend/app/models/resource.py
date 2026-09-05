"""Equipment / resource model."""
import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ResourceCategory(str, enum.Enum):
    EXCAVATORS = "EXCAVATORS"
    CONCRETE_MIXERS = "CONCRETE_MIXERS"
    CRANES = "CRANES"
    DUMP_TRUCKS = "DUMP_TRUCKS"
    GENERATORS = "GENERATORS"
    SAFETY_EQUIPMENT = "SAFETY_EQUIPMENT"


class AvailabilityStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    IN_USE = "IN_USE"
    UNDER_MAINTENANCE = "UNDER_MAINTENANCE"
    OUT_OF_SERVICE = "OUT_OF_SERVICE"


class Resource(Base):
    """A piece of equipment/machinery that can be assigned to a project."""

    __tablename__ = "resources"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[ResourceCategory] = mapped_column(Enum(ResourceCategory), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    availability_status: Mapped[AvailabilityStatus] = mapped_column(
        Enum(AvailabilityStatus), nullable=False, default=AvailabilityStatus.AVAILABLE
    )
    utilization_percentage: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    assigned_project_id: Mapped[int | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )
    maintenance_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    project = relationship("Project", back_populates="resources")
