"""Worker schema (Milestone 1: read-only representation)."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.worker import WorkerCategory, WorkerStatus


class WorkerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    worker_category: WorkerCategory
    skill: Optional[str] = None
    assigned_project_id: Optional[int] = None
    joining_date: Optional[date] = None
    status: WorkerStatus
    created_at: datetime
    updated_at: datetime
