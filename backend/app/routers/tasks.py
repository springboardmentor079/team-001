"""
Tasks router — /api/projects/{project_id}/tasks
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_manager_or_admin
from app.models.task import TaskStatus
from app.models.user import User
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.schemas.common import MessageResponse
from app.services.project_service import get_project_by_id
from app.services.task_service import (
    count_tasks_for_project,
    create_task,
    delete_task,
    get_task_by_id,
    get_tasks_for_project,
    update_task,
)

router = APIRouter(prefix="/api/projects/{project_id}/tasks", tags=["Tasks"])


def _get_project_or_404(project_id: int, db: Session):
    project = get_project_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return project


@router.get(
    "/",
    response_model=List[TaskResponse],
    summary="List tasks for a project",
)
def list_tasks(
    project_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[TaskStatus] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _get_project_or_404(project_id, db)
    return get_tasks_for_project(db, project_id, skip=skip, limit=limit, status=status)


@router.post(
    "/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a task within a project (manager/admin)",
)
def create_new_task(
    project_id: int,
    data: TaskCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_admin),
):
    _get_project_or_404(project_id, db)
    return create_task(db, project_id, data)


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get a specific task",
)
def get_task(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _get_project_or_404(project_id, db)
    task = get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    return task


@router.put(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update a task (manager/admin or assignee)",
)
def update_existing_task(
    project_id: int,
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_project_or_404(project_id, db)
    task = get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    # Allow assignee to update their own task status; managers/admins can update anything
    from app.models.user import UserRole
    allowed_roles = {UserRole.admin, UserRole.project_manager}
    if current_user.role not in allowed_roles and task.assigned_to != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update tasks assigned to you.",
        )
    return update_task(db, task, data)


@router.delete(
    "/{task_id}",
    response_model=MessageResponse,
    summary="Delete a task (manager/admin)",
)
def delete_existing_task(
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_admin),
):
    _get_project_or_404(project_id, db)
    task = get_task_by_id(db, task_id)
    if not task or task.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    delete_task(db, task)
    return MessageResponse(message=f"Task '{task.title}' deleted successfully.")
