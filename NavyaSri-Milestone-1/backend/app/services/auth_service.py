"""
Authentication business logic: registration, login, and the development
password-reset workflow.

Keeping this logic out of the API layer makes it independently testable
and keeps `app/api/auth.py` focused on HTTP concerns only.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, ResetPasswordRequest


def register_user(db: Session, payload: RegisterRequest) -> User:
    """Create a new user account. Raises HTTP 400 on duplicate email."""
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        role=payload.role,
        phone_number=payload.phone_number,
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Validate credentials. Raises HTTP 401 on any failure."""
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact an administrator.",
        )
    return user


def issue_access_token(user: User) -> str:
    """Create a JWT access token carrying user_id, email, and role."""
    return create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role.value}
    )


def login_user(db: Session, payload: LoginRequest) -> tuple[User, str]:
    """Authenticate a user and issue an access token."""
    user = authenticate_user(db, payload.email, payload.password)
    token = issue_access_token(user)
    return user, token


def request_password_reset(db: Session, email: str) -> Optional[str]:
    """
    Generate a password reset token for the given email.

    Returns None if no account exists for that email so the caller can
    return a generic "if this account exists" message without leaking
    which emails are registered.
    """
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user:
        return None
    return create_password_reset_token(user.email)


def reset_password(db: Session, payload: ResetPasswordRequest) -> User:
    """Validate a password-reset token and set the new password."""
    token_payload = decode_token(payload.token)
    if not token_payload or token_payload.get("type") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    email = token_payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    user.hashed_password = hash_password(payload.new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
