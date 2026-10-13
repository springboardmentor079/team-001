from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.database.session import get_db
from app.models.user import User
from app.schemas.shift import PayrollReport, ShiftCreate, ShiftOut
from app.services import shift_service

router = APIRouter(tags=["Shifts & Payroll"])
SCHEDULE_ROLES = ("admin", "project_manager", "contractor", "site_engineer")


@router.get("/api/shifts", response_model=list[ShiftOut])
def list_shifts(
    start: Optional[date] = None,
    end: Optional[date] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return shift_service.list_shifts(db, start, end, project_id)


@router.post("/api/shifts", response_model=ShiftOut, status_code=201)
def assign_shift(
    payload: ShiftCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(*SCHEDULE_ROLES))
):
    return shift_service.assign_shift(db, payload)


@router.delete("/api/shifts/{shift_id}", status_code=204)
def delete_shift(
    shift_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(*SCHEDULE_ROLES))
):
    shift_service.delete_shift(db, shift_id)


@router.get("/api/payroll", response_model=PayrollReport)
def payroll(
    start: date,
    end: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "project_manager")),
):
    """Wages owed per worker between two dates, calculated from attendance."""
    return shift_service.payroll(db, start, end)
