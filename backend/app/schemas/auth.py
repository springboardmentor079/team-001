from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional

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
    # Only present in development mode (SMTP not configured). When an email
    # service is configured the token is emailed and never returned here.
    reset_token: Optional[str] = None
    email_sent: bool = False


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str = Field(min_length=6)


class ProfileUpdate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class UserAdminUpdate(BaseModel):
    role: Optional[Role] = None
    is_active: Optional[bool] = None


class UserDirectoryEntry(BaseModel):
    id: int
    full_name: str
    role: str

    class Config:
        from_attributes = True
