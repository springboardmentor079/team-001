"""
Pydantic schemas for authentication — login request and token response.
"""
from pydantic import BaseModel, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., examples=["jane@example.com"])
    password: str = Field(..., min_length=1, examples=["Password123"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str           # user id as string
    role: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str = Field(..., min_length=32, max_length=256)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not any(char.isupper() for char in value) or not any(char.islower() for char in value) or not any(char.isdigit() for char in value):
            raise ValueError("Password must contain uppercase, lowercase, and numeric characters.")
        return value
