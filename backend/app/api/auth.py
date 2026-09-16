from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.auth import (
    UserSignup,
    UserLogin,
    UserOut,
    Token,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
)
from app.services.auth_service import (
    signup_user,
    authenticate_user,
    build_token_for_user,
    create_reset_token,
    reset_password,
)
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserOut, status_code=201)
def signup(payload: UserSignup, db: Session = Depends(get_db)):
    user = signup_user(db, payload)
    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload)
    token = build_token_for_user(user)
    return Token(access_token=token, user=user)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generates a reset token. In production this would be emailed to the
    user instead of returned directly — it's returned here so the flow can
    be demoed without an SMTP/email service configured."""
    token = create_reset_token(db, payload.email)
    return ForgotPasswordResponse(
        message="Password reset token generated", reset_token=token
    )


@router.post("/reset-password")
def reset_password_route(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset_password(db, payload.reset_token, payload.new_password)
    return {"message": "Password has been reset successfully"}
