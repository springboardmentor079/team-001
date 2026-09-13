"""Authentication-related Pydantic schemas."""
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole
from app.schemas.user import UserResponse


class RegisterRequest(BaseModel):
    """Payload for POST /auth/register."""

    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)
    role: UserRole
    phone_number: Optional[str] = Field(None, max_length=30)

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not any(c.isupper() for c in value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in value):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in value):
            raise ValueError("Password must contain at least one digit")
        return value

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, value: str, info) -> str:
        password = info.data.get("password")
        if password is not None and value != password:
            raise ValueError("Password and confirm password do not match")
        return value


class LoginRequest(BaseModel):
    """Payload for POST /auth/login (JSON login, in addition to OAuth2 form login)."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Response returned after a successful login."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """
    Development-friendly response.

    In production this would only ever say "if the email exists, a reset
    link was sent" — here we additionally surface the token/expiry so the
    flow is testable without a real SMTP integration.
    """

    message: str
    reset_token: Optional[str] = None
    expires_in_minutes: Optional[int] = None


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("confirm_new_password")
    @classmethod
    def passwords_match(cls, value: str, info) -> str:
        new_password = info.data.get("new_password")
        if new_password is not None and value != new_password:
            raise ValueError("New password and confirmation do not match")
        return value
