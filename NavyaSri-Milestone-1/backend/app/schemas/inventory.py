"""Inventory schema (Milestone 1: read-only representation)."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.inventory import MaterialCategory


class InventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    material_name: str
    category: MaterialCategory
    quantity_available: float
    minimum_stock_level: float
    unit: str
    location: Optional[str] = None
    last_updated: datetime
    created_at: datetime
    updated_at: datetime
