from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.schemas.workforce import WorkerCreate, WorkerUpdate, WorkerOut, AttendanceCreate, AttendanceOut
from app.services import workforce_service

router = APIRouter(tags=["Workforce"])
MANAGE_ROLES = ("admin", "project_manager", "contractor")


@router.get("/api/workers", response_model=list[WorkerOut])
def list_workers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return workforce_service.list_workers(db)


@router.post("/api/workers", response_model=WorkerOut, status_code=201)
def create_worker(
    payload: WorkerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGE_ROLES)),
):
    return workforce_service.create_worker(db, payload)


@router.patch("/api/workers/{worker_id}", response_model=WorkerOut)
def update_worker(
    worker_id: int,
    payload: WorkerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGE_ROLES)),
):
    return workforce_service.update_worker(db, worker_id, payload)


@router.delete("/api/workers/{worker_id}", status_code=204)
def delete_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGE_ROLES)),
):
    workforce_service.delete_worker(db, worker_id)


@router.post("/api/attendance", response_model=AttendanceOut, status_code=201)
def mark_attendance(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGE_ROLES, "site_engineer")),
):
    return workforce_service.mark_attendance(db, payload)


@router.get("/api/attendance", response_model=list[AttendanceOut])
def list_attendance(
    worker_id: Optional[int] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return workforce_service.list_attendance(db, worker_id, project_id)
