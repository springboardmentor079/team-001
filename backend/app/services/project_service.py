"""
Project service — database operations for Project model.
"""
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


def get_project_by_id(db: Session, project_id: int) -> Optional[Project]:
    return db.query(Project).filter(Project.id == project_id).first()


def get_all_projects(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
) -> List[Project]:
    query = db.query(Project)
    if status:
        query = query.filter(Project.status == status)
    return query.offset(skip).limit(limit).all()


def count_projects(db: Session, status: Optional[str] = None) -> int:
    query = db.query(Project)
    if status:
        query = query.filter(Project.status == status)
    return query.count()


def create_project(db: Session, data: ProjectCreate) -> Project:
    project = Project(**data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, project: Project, data: ProjectUpdate) -> Project:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: Project) -> None:
    db.delete(project)
    db.commit()
