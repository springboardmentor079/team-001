"""
Pydantic schemas for Task.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.task import TaskPriority, TaskStatus
from app.schemas.user import UserPublic


# ── Create ────────────────────────────────────────────────────────────────
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200, examples=["Pour foundation concrete"])
    description: Optional[str] = Field(None, max_length=2000)
    status: TaskStatus = Field(default=TaskStatus.pending)
    priority: TaskPriority = Field(default=TaskPriority.medium)
    due_date: Optional[date] = None
    assigned_to: Optional[int] = None


# ── Update ────────────────────────────────────────────────────────────────
class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[date] = None
    assigned_to: Optional[int] = None


# ── Response ──────────────────────────────────────────────────────────────
class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[date]
    project_id: int
    assigned_to: Optional[int]
    assignee: Optional[UserPublic]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
