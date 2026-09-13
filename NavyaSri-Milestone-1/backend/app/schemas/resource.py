"""Resource schema (Milestone 1: read-only representation)."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.resource import AvailabilityStatus, ResourceCategory


class ResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: ResourceCategory
    quantity: int
    availability_status: AvailabilityStatus
    utilization_percentage: float
    assigned_project_id: Optional[int] = None
    maintenance_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime
