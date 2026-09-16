from pydantic import BaseModel, EmailStr, Field
from typing import Literal

Role = Literal[
    "admin", "project_manager", "site_engineer", "contractor", "worker", "client"
]


class UserSignup(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6)
    role: Role = "worker"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str
    # In production this would be emailed, not returned in the response.
    # Returned here only so the reset flow can be demoed without an SMTP setup.
    reset_token: str


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str = Field(min_length=6)
