from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.procurement import Procurement
from app.models.vendor import Vendor
from app.schemas.vendor import VendorCreate, VendorUpdate


def list_vendors(db: Session) -> list[Vendor]:
    return db.query(Vendor).order_by(Vendor.name).all()


def create_vendor(db: Session, payload: VendorCreate) -> Vendor:
    if db.query(Vendor).filter(Vendor.name.ilike(payload.name)).first():
        raise HTTPException(status_code=400, detail="A vendor with this name already exists")
    vendor = Vendor(**payload.model_dump())
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


def update_vendor(db: Session, vendor_id: int, payload: VendorUpdate) -> Vendor:
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(vendor, field, value)
    db.commit()
    db.refresh(vendor)
    return vendor


def delete_vendor(db: Session, vendor_id: int) -> None:
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    if db.query(Procurement).filter(Procurement.vendor_name == vendor.name).first():
        raise HTTPException(status_code=400, detail="This vendor has procurement records and cannot be deleted")
    db.delete(vendor)
    db.commit()


def vendor_summary(db: Session) -> list[dict]:
    """Orders and spend per vendor (supplier management view)."""
    rows = []
    for v in list_vendors(db):
        orders = db.query(Procurement).filter(Procurement.vendor_name == v.name).all()
        rows.append({
            "vendor_id": v.id,
            "vendor_name": v.name,
            "orders": len(orders),
            "total_cost": float(sum((o.cost or 0) for o in orders)),
            "unpaid_invoices": sum(1 for o in orders if o.invoice_number and not o.invoice_paid),
        })
    return rows
