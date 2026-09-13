"""Project milestone schema (Milestone 1: read-only representation)."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.milestone import MilestoneStatus


class MilestoneResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    title: str
    description: Optional[str] = None
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_completion_date: Optional[date] = None
    progress_percentage: int
    status: MilestoneStatus
    created_at: datetime
    updated_at: datetime
