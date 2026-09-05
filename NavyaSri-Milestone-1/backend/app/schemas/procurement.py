"""Procurement schema (Milestone 1: read-only representation)."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.procurement import ProcurementCategory, ProcurementStatus


class ProcurementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    item_name: str
    category: ProcurementCategory
    vendor_name: Optional[str] = None
    quantity: int
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    status: ProcurementStatus
    request_date: Optional[date] = None
    expected_delivery_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
