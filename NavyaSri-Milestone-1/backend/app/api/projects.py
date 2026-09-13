"""
Project endpoints (Milestone 1: read-only preview).

Full project CRUD, milestone tracking, resource assignment, and budget
workflows are implemented in a later milestone. For Milestone 1 we expose a
simple, role-aware read-only list so the frontend/database layer can be
demonstrated end-to-end.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.database.database import get_db
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.common import APIResponse
from app.schemas.project import ProjectResponse
from app.utils.helpers import success_response

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=APIResponse[list[ProjectResponse]], summary="List visible projects")
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Return projects visible to the current user.

    - Administrators see every project.
    - Project Managers see projects they manage.
    - Clients see projects where they are the client.
    - Other roles currently see all projects (assignment-based scoping for
      Site Engineers/Contractors/Workers arrives with the workforce module
      in a later milestone).
    """
    query = db.query(Project)

    if current_user.role == UserRole.PROJECT_MANAGER:
        query = query.filter(Project.project_manager_id == current_user.id)
    elif current_user.role == UserRole.CLIENT:
        query = query.filter(Project.client_id == current_user.id)

    projects = query.order_by(Project.created_at.desc()).all()
    return success_response(
        "Projects retrieved.", [ProjectResponse.model_validate(p) for p in projects]
    )
