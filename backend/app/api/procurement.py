from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.schemas.procurement import ProcurementCreate, ProcurementUpdate, ProcurementOut
from app.services import procurement_service

router = APIRouter(prefix="/api/procurement", tags=["Procurement"])
MANAGE_ROLES = ("admin", "project_manager", "contractor")


@router.get("/", response_model=list[ProcurementOut])
def list_requests(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return procurement_service.list_requests(db, status)


@router.post("/", response_model=ProcurementOut, status_code=201)
def create_request(
    payload: ProcurementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGE_ROLES)),
):
    return procurement_service.create_request(db, payload, requested_by=current_user.id)


@router.patch("/{request_id}", response_model=ProcurementOut)
def update_request(
    request_id: int,
    payload: ProcurementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "project_manager")),
):
    return procurement_service.update_request(db, request_id, payload)
