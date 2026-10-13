from datetime import date
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.project import Project
from app.models.shift import Shift
from app.models.worker import Worker
from app.schemas.shift import ShiftCreate


def assign_shift(db: Session, payload: ShiftCreate) -> Shift:
    if not db.query(Worker).filter(Worker.id == payload.worker_id).first():
        raise HTTPException(status_code=404, detail="Worker not found")
    if not db.query(Project).filter(Project.id == payload.project_id).first():
        raise HTTPException(status_code=404, detail="Project not found")

    existing = (
        db.query(Shift)
        .filter(Shift.worker_id == payload.worker_id, Shift.shift_date == payload.shift_date)
        .first()
    )
    if existing:  # one shift per worker per day: re-assigning updates it
        existing.project_id = payload.project_id
        existing.shift_type = payload.shift_type
        db.commit()
        db.refresh(existing)
        return existing

    shift = Shift(**payload.model_dump())
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift


def list_shifts(
    db: Session, start: Optional[date] = None, end: Optional[date] = None, project_id: Optional[int] = None
) -> list[Shift]:
    query = db.query(Shift)
    if start:
        query = query.filter(Shift.shift_date >= start)
    if end:
        query = query.filter(Shift.shift_date <= end)
    if project_id:
        query = query.filter(Shift.project_id == project_id)
    return query.order_by(Shift.shift_date.desc(), Shift.id.desc()).all()


def delete_shift(db: Session, shift_id: int) -> None:
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    db.delete(shift)
    db.commit()


def payroll(db: Session, start: date, end: date) -> dict:
    """Wages owed per worker for a period, derived from attendance.

    present = 1 day, half_day = 0.5 day, absent / leave = unpaid.
    """
    if end < start:
        raise HTTPException(status_code=400, detail="End date must not be before start date")

    records = (
        db.query(Attendance).filter(Attendance.date >= start, Attendance.date <= end).all()
    )
    by_worker: dict[int, dict[str, int]] = {}
    for rec in records:
        counts = by_worker.setdefault(rec.worker_id, {"present": 0, "half_day": 0, "absent": 0, "leave": 0})
        counts[rec.status] = counts.get(rec.status, 0) + 1

    lines = []
    for worker in db.query(Worker).order_by(Worker.full_name).all():
        c = by_worker.get(worker.id, {"present": 0, "half_day": 0, "absent": 0, "leave": 0})
        payable = c["present"] + 0.5 * c["half_day"]
        wage = float(worker.daily_wage or 0)
        lines.append({
            "worker_id": worker.id,
            "worker_name": worker.full_name,
            "category": worker.category,
            "daily_wage": wage,
            "present_days": c["present"],
            "half_days": c["half_day"],
            "absent_days": c["absent"],
            "leave_days": c["leave"],
            "payable_days": payable,
            "amount": round(payable * wage, 2),
        })
    return {"start": start, "end": end, "total_amount": round(sum(l["amount"] for l in lines), 2), "lines": lines}
