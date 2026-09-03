"""
Pydantic schemas for Project.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.project import ProjectStatus
from app.schemas.user import UserPublic


# ── Create ────────────────────────────────────────────────────────────────
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200, examples=["Highway Overpass Phase 1"])
    description: Optional[str] = Field(None, max_length=2000)
    location: Optional[str] = Field(None, max_length=300)
    status: ProjectStatus = Field(default=ProjectStatus.planning)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    manager_id: Optional[int] = None


# ── Update (all fields optional) ──────────────────────────────────────────
class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    location: Optional[str] = Field(None, max_length=300)
    status: Optional[ProjectStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    manager_id: Optional[int] = None


# ── Response ──────────────────────────────────────────────────────────────
class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    location: Optional[str]
    status: ProjectStatus
    start_date: Optional[date]
    end_date: Optional[date]
    manager_id: Optional[int]
    manager: Optional[UserPublic]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Minimal summary (used in lists) ──────────────────────────────────────
class ProjectSummary(BaseModel):
    id: int
    name: str
    status: ProjectStatus
    location: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    manager_id: Optional[int]

    model_config = {"from_attributes": True}
