"""Attendance schema (Milestone 1: read-only representation)."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.attendance import AttendanceStatus


class AttendanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    worker_id: int
    project_id: int
    attendance_date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: AttendanceStatus
    created_at: datetime
    updated_at: datetime
