"""
Role-specific dashboard summary endpoints.

For Milestone 1 these return real counts computed from the database where
the relevant tables already have data (users, projects, milestones), and
sensible zeroed placeholders for modules that are not implemented until a
later milestone (site activities, workforce, procurement, etc).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.database.database import get_db
from app.models.milestone import MilestoneStatus, ProjectMilestone
from app.models.project import Project, ProjectStatus
from app.models.user import User, UserRole
from app.schemas.common import APIResponse
from app.schemas.user import UserResponse
from app.utils.helpers import success_response

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/admin", response_model=APIResponse, summary="Administrator dashboard summary")
def admin_dashboard(
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles([UserRole.ADMIN])),
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active.is_(True)).count()
    total_projects = db.query(Project).count()
    active_projects = db.query(Project).filter(Project.status == ProjectStatus.IN_PROGRESS).count()
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(5).all()

    data = {
        "total_users": total_users,
        "active_users": active_users,
        "total_projects": total_projects,
        "active_projects": active_projects,
        "recent_users": [UserResponse.model_validate(u).model_dump(mode="json") for u in recent_users],
    }
    return success_response("Administrator dashboard data retrieved.", data)


@router.get(
    "/project-manager",
    response_model=APIResponse,
    summary="Project Manager dashboard summary",
)
def project_manager_dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles([UserRole.PROJECT_MANAGER])),
):
    projects_query = db.query(Project).filter(Project.project_manager_id == user.id)
    assigned_projects = projects_query.count()
    active_projects = projects_query.filter(Project.status == ProjectStatus.IN_PROGRESS).count()

    project_ids = [p.id for p in projects_query.all()]
    upcoming_milestones = 0
    overall_progress = 0
    if project_ids:
        milestones_query = db.query(ProjectMilestone).filter(
            ProjectMilestone.project_id.in_(project_ids)
        )
        upcoming_milestones = milestones_query.filter(
            ProjectMilestone.status != MilestoneStatus.COMPLETED
        ).count()
        milestones = milestones_query.all()
        if milestones:
            overall_progress = round(
                sum(m.progress_percentage for m in milestones) / len(milestones), 1
            )

    data = {
        "assigned_projects": assigned_projects,
        "active_projects": active_projects,
        "upcoming_milestones": upcoming_milestones,
        "overall_progress_percentage": overall_progress,
    }
    return success_response("Project Manager dashboard data retrieved.", data)


@router.get(
    "/site-engineer",
    response_model=APIResponse,
    summary="Site Engineer dashboard summary",
)
def site_engineer_dashboard(
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles([UserRole.SITE_ENGINEER])),
):
    total_projects = db.query(Project).filter(Project.status == ProjectStatus.IN_PROGRESS).count()

    # Site-activity and task tracking are introduced in a later milestone.
    data = {
        "assigned_projects": total_projects,
        "pending_site_activities": 0,
        "pending_tasks": 0,
        "progress_overview_percentage": 0,
    }
    return success_response("Site Engineer dashboard data retrieved.", data)


@router.get("/contractor", response_model=APIResponse, summary="Contractor dashboard summary")
def contractor_dashboard(
    db: Session = Depends(get_db),
    _user: User = Depends(require_roles([UserRole.CONTRACTOR])),
):
    total_projects = db.query(Project).filter(Project.status == ProjectStatus.IN_PROGRESS).count()

    # Workforce/task assignment for contractors arrives in a later milestone.
    data = {
        "assigned_work": total_projects,
        "project_progress_percentage": 0,
        "upcoming_deadlines": 0,
    }
    return success_response("Contractor dashboard data retrieved.", data)


@router.get("/client", response_model=APIResponse, summary="Client dashboard summary")
def client_dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles([UserRole.CLIENT])),
):
    projects_query = db.query(Project).filter(Project.client_id == user.id)
    my_projects = projects_query.count()
    projects = projects_query.all()

    progress_percentage = 0
    if projects:
        project_ids = [p.id for p in projects]
        milestones = (
            db.query(ProjectMilestone).filter(ProjectMilestone.project_id.in_(project_ids)).all()
        )
        if milestones:
            progress_percentage = round(
                sum(m.progress_percentage for m in milestones) / len(milestones), 1
            )

    data = {
        "my_projects": my_projects,
        "project_statuses": [p.status.value for p in projects],
        "progress_percentage": progress_percentage,
    }
    return success_response("Client dashboard data retrieved.", data)


@router.get("/worker", response_model=APIResponse, summary="Worker dashboard summary")
def worker_dashboard(
    _user: User = Depends(require_roles([UserRole.WORKER])),
):
    # Attendance and task-of-the-day features arrive with the workforce module.
    data = {
        "assigned_project": None,
        "todays_status": "NOT_RECORDED",
        "upcoming_work_items": 0,
    }
    return success_response("Worker dashboard data retrieved.", data)
