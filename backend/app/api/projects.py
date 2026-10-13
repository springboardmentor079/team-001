from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectOut,
    MilestoneCreate, MilestoneUpdate, MilestoneOut,
)
from app.services import project_service

router = APIRouter(prefix="/api/projects", tags=["Projects"])
MANAGE_ROLES = ("admin", "project_manager")


@router.get("/", response_model=list[ProjectOut])
def list_projects(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return project_service.list_projects(db, status)


@router.post("/", response_model=ProjectOut, status_code=201)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGE_ROLES)),
):
    return project_service.create_project(db, payload, manager_id=current_user.id)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return project_service.get_project(db, project_id)


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGE_ROLES)),
):
    return project_service.update_project(db, project_id, payload)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGE_ROLES)),
):
    project_service.delete_project(db, project_id)


@router.get("/{project_id}/milestones", response_model=list[MilestoneOut])
def list_milestones(
    project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return project_service.list_milestones(db, project_id)


@router.post("/{project_id}/milestones", response_model=MilestoneOut, status_code=201)
def add_milestone(
    project_id: int,
    payload: MilestoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGE_ROLES, "site_engineer")),
):
    return project_service.add_milestone(db, project_id, payload)


@router.patch("/milestones/{milestone_id}", response_model=MilestoneOut)
def update_milestone(
    milestone_id: int,
    payload: MilestoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGE_ROLES, "site_engineer")),
):
    return project_service.update_milestone(db, milestone_id, payload)
