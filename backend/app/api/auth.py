from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.auth import (
    UserSignup, UserLogin, UserOut, Token,
    ForgotPasswordRequest, ForgotPasswordResponse, ResetPasswordRequest,
    ProfileUpdate, ChangePasswordRequest,
)
from app.services.auth_service import (
    signup_user, authenticate_user, build_token_for_user,
    request_password_reset, reset_password, update_profile, change_password,
)
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserOut, status_code=201)
def signup(payload: UserSignup, db: Session = Depends(get_db)):
    return signup_user(db, payload)


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload)
    token = build_token_for_user(user)
    return Token(access_token=token, user=user)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_profile(db, current_user, payload.full_name)


@router.post("/change-password")
def change_my_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    change_password(db, current_user, payload.current_password, payload.new_password)
    return {"message": "Password changed successfully"}


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return ForgotPasswordResponse(**request_password_reset(db, payload.email))


@router.post("/reset-password")
def reset_password_route(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset_password(db, payload.reset_token, payload.new_password)
    return {"message": "Password has been reset successfully"}
