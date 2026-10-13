from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field

VendorCategory = Literal["raw_materials", "equipment", "machinery", "safety_equipment", "office_supplies"]


class VendorCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    category: VendorCategory
    contact_person: Optional[str] = Field(default=None, max_length=120)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=30)


class VendorUpdate(BaseModel):
    category: Optional[VendorCategory] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class VendorOut(BaseModel):
    id: int
    name: str
    category: str
    contact_person: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
