"""Material inventory model."""
import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class MaterialCategory(str, enum.Enum):
    CEMENT = "CEMENT"
    STEEL = "STEEL"
    BRICKS = "BRICKS"
    SAND = "SAND"
    CONCRETE = "CONCRETE"
    ELECTRICAL_MATERIALS = "ELECTRICAL_MATERIALS"
    PLUMBING_MATERIALS = "PLUMBING_MATERIALS"


class Inventory(Base):
    """A stock-tracked construction material."""

    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    material_name: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[MaterialCategory] = mapped_column(Enum(MaterialCategory), nullable=False)
    quantity_available: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    minimum_stock_level: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="units")
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
