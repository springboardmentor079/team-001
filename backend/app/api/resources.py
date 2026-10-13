from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.schemas.resource import (
    ResourceCreate, ResourceUpdate, ResourceOut,
    InventoryCreate, InventoryUpdate, InventoryOut,
)
from app.services import resource_service

router = APIRouter(tags=["Resources & Inventory"])
MANAGE_ROLES = ("admin", "project_manager", "site_engineer")


@router.get("/api/resources", response_model=list[ResourceOut])
def list_resources(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return resource_service.list_resources(db)


@router.post("/api/resources", response_model=ResourceOut, status_code=201)
def create_resource(
    payload: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGE_ROLES)),
):
    return resource_service.create_resource(db, payload)


@router.patch("/api/resources/{resource_id}", response_model=ResourceOut)
def update_resource(
    resource_id: int,
    payload: ResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGE_ROLES)),
):
    return resource_service.update_resource(db, resource_id, payload)


@router.get("/api/inventory", response_model=list[InventoryOut])
def list_inventory(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return resource_service.list_inventory(db)


@router.post("/api/inventory", response_model=InventoryOut, status_code=201)
def create_inventory_item(
    payload: InventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGE_ROLES, "contractor")),
):
    return resource_service.create_inventory_item(db, payload)


@router.patch("/api/inventory/{item_id}", response_model=InventoryOut)
def update_inventory_item(
    item_id: int,
    payload: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*MANAGE_ROLES, "contractor")),
):
    return resource_service.update_inventory_item(db, item_id, payload)


@router.get("/api/inventory/alerts/low-stock", response_model=list[InventoryOut])
def low_stock(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return resource_service.low_stock_items(db)
