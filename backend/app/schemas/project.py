from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field

Category = Literal["residential", "commercial", "industrial", "infrastructure", "government"]
Status = Literal["planned", "in_progress", "on_hold", "completed", "closed"]


class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: Optional[str] = None
    category: Category
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: float = 0


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[Category] = None
    status: Optional[Status] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None


class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: str
    status: str
    start_date: Optional[date]
    end_date: Optional[date]
    budget: float
    manager_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


MilestoneCategory = Literal[
    "foundation", "structural", "electrical", "plumbing", "finishing", "inspection"
]
MilestoneStatus = Literal["pending", "in_progress", "completed", "delayed"]


class MilestoneCreate(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    category: Optional[MilestoneCategory] = None
    due_date: Optional[date] = None


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[MilestoneCategory] = None
    due_date: Optional[date] = None
    status: Optional[MilestoneStatus] = None


class MilestoneOut(BaseModel):
    id: int
    project_id: int
    title: str
    category: Optional[str]
    due_date: Optional[date]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
