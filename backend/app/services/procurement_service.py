from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.procurement import Procurement
from app.schemas.procurement import ProcurementCreate, ProcurementUpdate
from app.services import notification_service


def create_request(db: Session, payload: ProcurementCreate, requested_by: int | None = None) -> Procurement:
    request = Procurement(**payload.model_dump(), status="requested", requested_by=requested_by)
    db.add(request)
    db.commit()
    db.refresh(request)
    notification_service.notify_roles(
        db, ["admin", "project_manager"],
        "New procurement request",
        f"{request.item_name} (qty {float(request.quantity):g}, cost {float(request.cost):g}) needs review.",
        "procurement_alert", exclude_user_id=requested_by,
    )
    return request


def list_requests(db: Session, status_filter: str | None = None) -> list[Procurement]:
    query = db.query(Procurement)
    if status_filter:
        query = query.filter(Procurement.status == status_filter)
    return query.order_by(Procurement.created_at.desc()).all()


def update_request(db: Session, request_id: int, payload: ProcurementUpdate) -> Procurement:
    request = db.query(Procurement).filter(Procurement.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Procurement request not found")
    old_status = request.status
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(request, field, value)
    db.commit()
    db.refresh(request)
    if payload.status and payload.status != old_status:
        notification_service.notify_user(
            db, request.requested_by,
            f"Procurement {request.status}",
            f"Your request for '{request.item_name}' is now '{request.status}'.",
            "procurement_alert", email=True,
        )
    return request
