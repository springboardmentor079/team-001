from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field

ProcurementCategory = Literal[
    "raw_materials", "equipment", "machinery", "safety_equipment", "office_supplies"
]
ProcurementStatus = Literal["requested", "approved", "ordered", "delivered", "rejected"]


class ProcurementCreate(BaseModel):
    item_name: str = Field(min_length=2, max_length=120)
    category: ProcurementCategory
    project_id: Optional[int] = None
    vendor_name: Optional[str] = None
    quantity: float = 0
    cost: float = 0


class ProcurementUpdate(BaseModel):
    status: Optional[ProcurementStatus] = None
    invoice_number: Optional[str] = Field(default=None, max_length=60)
    invoice_paid: Optional[bool] = None
    vendor_name: Optional[str] = None
    cost: Optional[float] = None


class ProcurementOut(BaseModel):
    id: int
    project_id: Optional[int]
    item_name: str
    category: str
    vendor_name: Optional[str]
    requested_by: Optional[int] = None
    invoice_number: Optional[str] = None
    invoice_paid: bool = False
    quantity: float
    cost: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
