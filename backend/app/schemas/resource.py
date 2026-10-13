from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field

ResourceCategory = Literal[
    "excavator", "concrete_mixer", "crane", "dump_truck", "generator", "safety_equipment"
]
ResourceStatus = Literal["available", "in_use", "maintenance", "unavailable"]


class ResourceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    category: ResourceCategory
    project_id: Optional[int] = None


class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    project_id: Optional[int] = None
    status: Optional[ResourceStatus] = None


class ResourceOut(BaseModel):
    id: int
    name: str
    category: str
    project_id: Optional[int]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


InventoryCategory = Literal[
    "cement", "steel", "bricks", "sand", "concrete", "electrical", "plumbing"
]


class InventoryCreate(BaseModel):
    material_name: str = Field(min_length=2, max_length=120)
    category: InventoryCategory
    project_id: Optional[int] = None
    quantity: float = 0
    unit: str = "unit"
    reorder_level: float = 0


class InventoryUpdate(BaseModel):
    quantity: Optional[float] = None
    reorder_level: Optional[float] = None
    project_id: Optional[int] = None


class InventoryOut(BaseModel):
    id: int
    project_id: Optional[int]
    material_name: str
    category: str
    quantity: float
    unit: str
    reorder_level: float
    updated_at: datetime

    class Config:
        from_attributes = True
