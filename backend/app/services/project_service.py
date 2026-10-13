from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.project import Project
from app.models.milestone import ProjectMilestone
from app.schemas.project import ProjectCreate, ProjectUpdate, MilestoneCreate, MilestoneUpdate
from app.services import notification_service


def create_project(db: Session, payload: ProjectCreate, manager_id: int) -> Project:
    project = Project(**payload.model_dump(), manager_id=manager_id, status="planned")
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def list_projects(db: Session, status_filter: Optional[str] = None) -> list[Project]:
    query = db.query(Project)
    if status_filter:
        query = query.filter(Project.status == status_filter)
    return query.order_by(Project.created_at.desc()).all()


def get_project(db: Session, project_id: int) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def update_project(db: Session, project_id: int, payload: ProjectUpdate) -> Project:
    project = get_project(db, project_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int) -> None:
    project = get_project(db, project_id)
    db.delete(project)
    db.commit()


def add_milestone(db: Session, project_id: int, payload: MilestoneCreate) -> ProjectMilestone:
    get_project(db, project_id)
    milestone = ProjectMilestone(**payload.model_dump(), project_id=project_id)
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


def list_milestones(db: Session, project_id: int) -> list[ProjectMilestone]:
    return (
        db.query(ProjectMilestone)
        .filter(ProjectMilestone.project_id == project_id)
        .order_by(ProjectMilestone.due_date.asc().nullslast())
        .all()
    )


def update_milestone(db: Session, milestone_id: int, payload: MilestoneUpdate) -> ProjectMilestone:
    milestone = db.query(ProjectMilestone).filter(ProjectMilestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    old_status = milestone.status
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(milestone, field, value)
    db.commit()
    db.refresh(milestone)
    if milestone.status == "delayed" and old_status != "delayed":
        project = db.query(Project).filter(Project.id == milestone.project_id).first()
        if project:
            notification_service.notify_user(
                db, project.manager_id, "Milestone delayed",
                f"'{milestone.title}' in project '{project.name}' has been marked delayed.",
                "project_update", email=True,
            )
    return milestone
