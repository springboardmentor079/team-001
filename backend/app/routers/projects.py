"""
Projects router — /api/projects
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_manager_or_admin
from app.models.project import ProjectStatus
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectSummary, ProjectUpdate
from app.schemas.common import MessageResponse
from app.services.project_service import (
    count_projects,
    create_project,
    delete_project,
    get_all_projects,
    get_project_by_id,
    update_project,
)

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.get(
    "/",
    response_model=List[ProjectSummary],
    summary="List all projects",
)
def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[ProjectStatus] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return get_all_projects(db, skip=skip, limit=limit, status=status)


@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project (manager/admin)",
)
def create_new_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_admin),
):
    return create_project(db, data)


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get a project by ID",
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    project = get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return project


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update a project (manager/admin)",
)
def update_existing_project(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_admin),
):
    project = get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return update_project(db, project, data)


@router.delete(
    "/{project_id}",
    response_model=MessageResponse,
    summary="Delete a project (manager/admin)",
)
def delete_existing_project(
    project_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_admin),
):
    project = get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    delete_project(db, project)
    return MessageResponse(message=f"Project '{project.name}' deleted successfully.")
