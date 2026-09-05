"""Report schema (Milestone 1: read-only representation)."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.report import ReportType


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    report_type: ReportType
    title: str
    generated_by: Optional[int] = None
    file_path: Optional[str] = None
    generated_at: datetime
