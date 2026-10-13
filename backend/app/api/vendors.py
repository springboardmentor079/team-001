from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.database.session import get_db
from app.models.user import User
from app.schemas.vendor import VendorCreate, VendorOut, VendorUpdate
from app.services import vendor_service

router = APIRouter(prefix="/api/vendors", tags=["Vendors"])
READ_ROLES = ("admin", "project_manager", "contractor")
WRITE_ROLES = ("admin", "project_manager")


@router.get("/", response_model=list[VendorOut])
def list_vendors(db: Session = Depends(get_db), current_user: User = Depends(require_role(*READ_ROLES))):
    return vendor_service.list_vendors(db)


@router.get("/summary")
def vendor_summary(db: Session = Depends(get_db), current_user: User = Depends(require_role(*WRITE_ROLES))):
    return vendor_service.vendor_summary(db)


@router.post("/", response_model=VendorOut, status_code=201)
def create_vendor(
    payload: VendorCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(*WRITE_ROLES))
):
    return vendor_service.create_vendor(db, payload)


@router.patch("/{vendor_id}", response_model=VendorOut)
def update_vendor(
    vendor_id: int, payload: VendorUpdate, db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*WRITE_ROLES)),
):
    return vendor_service.update_vendor(db, vendor_id, payload)


@router.delete("/{vendor_id}", status_code=204)
def delete_vendor(vendor_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(*WRITE_ROLES))):
    vendor_service.delete_vendor(db, vendor_id)
