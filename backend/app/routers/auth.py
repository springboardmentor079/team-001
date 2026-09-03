"""
Authentication router — /api/auth/signup and /api/auth/login
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.auth import LoginRequest, PasswordResetConfirm, PasswordResetRequest, TokenResponse
from app.models.user import UserRole
from app.schemas.user import PublicSignup, UserCreate, UserResponse
from app.services.user_service import create_password_reset_token, create_user, get_user_by_email, reset_password

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def signup(data: PublicSignup, db: Session = Depends(get_db)):
    """
    Create a new BuildTrack account.

    - **full_name**: minimum 2 characters
    - **email**: must be a valid, unique email address
    - **password**: minimum 8 characters, must include upper, lower, and digit
    Public registrations always receive the `client` role. Administrators assign
    elevated roles through the protected user-management API.
    """
    existing = get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    user = create_user(db, UserCreate(**data.model_dump(), role=UserRole.client))
    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive a JWT access token",
)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate with email and password.

    Returns a Bearer JWT token to use in the `Authorization` header
    for all protected endpoints.
    """
    user = get_user_by_email(db, data.email)
    if user is None or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact an administrator.",
        )
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token)


@router.post("/password-reset/request", status_code=status.HTTP_202_ACCEPTED)
def request_password_reset(data: PasswordResetRequest, db: Session = Depends(get_db)):
    """Create a one-time reset token. Wire the token into the configured mail provider in production."""
    user = get_user_by_email(db, data.email)
    if user:
        create_password_reset_token(db, user)
    # Keep this response identical for known and unknown accounts.
    return {"message": "If an account exists for this email, reset instructions have been sent."}


@router.post("/password-reset/confirm")
def confirm_password_reset(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    if not reset_password(db, data.token, data.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The reset token is invalid or expired.")
    return {"message": "Password updated successfully. Please sign in."}
