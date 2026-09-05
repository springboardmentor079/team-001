"""User-related Pydantic schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone_number: Optional[str] = Field(None, max_length=30)


class UserResponse(UserBase):
    """Public-facing representation of a user (never includes the password hash)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    role: UserRole
    profile_image: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime


class UserProfileUpdate(BaseModel):
    """Fields an authenticated user may update on their own profile."""

    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone_number: Optional[str] = Field(None, max_length=30)
    profile_image: Optional[str] = Field(None, max_length=500)


class UserStatusUpdate(BaseModel):
    """Admin-only: activate or deactivate a user account."""

    is_active: bool


class UserListResponse(BaseModel):
    """Paginated list of users for the admin user-management screen."""

    total: int
    items: list[UserResponse]
