from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.worker import Worker
from app.models.attendance import Attendance
from app.models.project import Project
from app.schemas.workforce import WorkerCreate, WorkerUpdate, AttendanceCreate
from app.services import notification_service


def _alert_if_absent(db: Session, worker: Worker, record: Attendance) -> None:
    if record.status != "absent":
        return
    project = db.query(Project).filter(Project.id == record.project_id).first()
    if project:
        notification_service.notify_user(
            db, project.manager_id, "Worker absent",
            f"{worker.full_name} was marked absent on {record.date.isoformat()} ({project.name}).",
            "attendance_alert", dedupe=True,
        )


def create_worker(db: Session, payload: WorkerCreate) -> Worker:
    worker = Worker(**payload.model_dump())
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return worker


def list_workers(db: Session) -> list[Worker]:
    return db.query(Worker).order_by(Worker.created_at.desc()).all()


def update_worker(db: Session, worker_id: int, payload: WorkerUpdate) -> Worker:
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(worker, field, value)
    db.commit()
    db.refresh(worker)
    return worker


def delete_worker(db: Session, worker_id: int) -> None:
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    db.delete(worker)
    db.commit()


def mark_attendance(db: Session, payload: AttendanceCreate) -> Attendance:
    worker = db.query(Worker).filter(Worker.id == payload.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    existing = (
        db.query(Attendance)
        .filter(Attendance.worker_id == payload.worker_id, Attendance.date == payload.date)
        .first()
    )
    if existing:
        existing.status = payload.status
        db.commit()
        db.refresh(existing)
        _alert_if_absent(db, worker, existing)
        return existing

    record = Attendance(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    _alert_if_absent(db, worker, record)
    return record


def list_attendance(db: Session, worker_id: int | None = None, project_id: int | None = None):
    query = db.query(Attendance)
    if worker_id:
        query = query.filter(Attendance.worker_id == worker_id)
    if project_id:
        query = query.filter(Attendance.project_id == project_id)
    return query.order_by(Attendance.date.desc()).all()
