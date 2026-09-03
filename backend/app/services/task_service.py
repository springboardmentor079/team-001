"""
Task service — database operations for Task model.
"""
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate


def get_task_by_id(db: Session, task_id: int) -> Optional[Task]:
    return db.query(Task).filter(Task.id == task_id).first()


def get_tasks_for_project(
    db: Session,
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
) -> List[Task]:
    query = db.query(Task).filter(Task.project_id == project_id)
    if status:
        query = query.filter(Task.status == status)
    return query.offset(skip).limit(limit).all()


def count_tasks_for_project(
    db: Session, project_id: int, status: Optional[str] = None
) -> int:
    query = db.query(Task).filter(Task.project_id == project_id)
    if status:
        query = query.filter(Task.status == status)
    return query.count()


def create_task(db: Session, project_id: int, data: TaskCreate) -> Task:
    task = Task(project_id=project_id, **data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task(db: Session, task: Task, data: TaskUpdate) -> Task:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()
