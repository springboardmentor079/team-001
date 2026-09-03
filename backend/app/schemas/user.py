"""
Pydantic schemas for User — request validation and response serialization.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole


# ── Shared base ───────────────────────────────────────────────────────────
class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150, examples=["Jane Smith"])
    email: EmailStr = Field(..., examples=["jane@example.com"])
    role: UserRole = Field(default=UserRole.client)


# ── Signup (create) ───────────────────────────────────────────────────────
class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128, examples=["Password123"])

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        return v


class PublicSignup(BaseModel):
    """Data accepted by public registration; role assignment is admin-only."""
    full_name: str = Field(..., min_length=2, max_length=150, examples=["Jane Smith"])
    email: EmailStr = Field(..., examples=["jane@example.com"])
    password: str = Field(..., min_length=8, max_length=128, examples=["Password123"])

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not any(char.isupper() for char in value):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not any(char.islower() for char in value):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least one digit.")
        return value


# ── Update ────────────────────────────────────────────────────────────────
class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class ProfileUpdate(BaseModel):
    """Fields a user may update on their own profile."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)


# ── Response (never exposes hashed_password) ──────────────────────────────
class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Minimal public profile (used inside nested responses) ─────────────────
class UserPublic(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole

    model_config = {"from_attributes": True}
