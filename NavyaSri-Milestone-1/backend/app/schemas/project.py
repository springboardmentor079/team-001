"""
Project schema (Milestone 1: read-only representation).

Full create/update/delete workflows for projects are implemented in a
later milestone; here we only expose enough to support dashboard summaries.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.project import ProjectCategory, ProjectStatus


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_name: str
    project_code: str
    description: Optional[str] = None
    category: ProjectCategory
    location: Optional[str] = None
    start_date: Optional[date] = None
    expected_end_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    budget: Optional[float] = None
    status: ProjectStatus
    project_manager_id: Optional[int] = None
    client_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
