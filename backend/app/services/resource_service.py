from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.resource import Resource
from app.models.inventory import Inventory
from app.schemas.resource import ResourceCreate, ResourceUpdate, InventoryCreate, InventoryUpdate
from app.services import notification_service


def _alert_if_low(db: Session, item: Inventory) -> None:
    if item.quantity <= item.reorder_level:
        notification_service.notify_roles(
            db, ["admin", "project_manager"], "Low stock alert",
            f"{item.material_name} is at {float(item.quantity):g} {item.unit} (reorder level {float(item.reorder_level):g}).",
            "procurement_alert", dedupe=True,
        )


def create_resource(db: Session, payload: ResourceCreate) -> Resource:
    resource = Resource(**payload.model_dump(), status="available")
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


def list_resources(db: Session) -> list[Resource]:
    return db.query(Resource).order_by(Resource.created_at.desc()).all()


def update_resource(db: Session, resource_id: int, payload: ResourceUpdate) -> Resource:
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(resource, field, value)
    db.commit()
    db.refresh(resource)
    return resource


def create_inventory_item(db: Session, payload: InventoryCreate) -> Inventory:
    item = Inventory(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    _alert_if_low(db, item)
    return item


def list_inventory(db: Session) -> list[Inventory]:
    return db.query(Inventory).order_by(Inventory.updated_at.desc()).all()


def update_inventory_item(db: Session, item_id: int, payload: InventoryUpdate) -> Inventory:
    item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    _alert_if_low(db, item)
    return item


def low_stock_items(db: Session) -> list[Inventory]:
    return db.query(Inventory).filter(Inventory.quantity <= Inventory.reorder_level).all()
