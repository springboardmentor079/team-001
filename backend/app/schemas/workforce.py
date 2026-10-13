from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field

WorkerCategory = Literal[
    "engineer", "supervisor", "contractor", "skilled", "unskilled", "consultant"
]


class WorkerCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    category: WorkerCategory
    project_id: Optional[int] = None
    contact_number: Optional[str] = None
    daily_wage: float = 0


class WorkerUpdate(BaseModel):
    full_name: Optional[str] = None
    project_id: Optional[int] = None
    contact_number: Optional[str] = None
    daily_wage: Optional[float] = None


class WorkerOut(BaseModel):
    id: int
    full_name: str
    category: str
    project_id: Optional[int]
    contact_number: Optional[str]
    daily_wage: float
    created_at: datetime

    class Config:
        from_attributes = True


AttendanceStatus = Literal["present", "absent", "half_day", "leave"]


class AttendanceCreate(BaseModel):
    worker_id: int
    project_id: int
    date: date
    status: AttendanceStatus = "present"


class AttendanceOut(BaseModel):
    id: int
    worker_id: int
    project_id: int
    date: date
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
