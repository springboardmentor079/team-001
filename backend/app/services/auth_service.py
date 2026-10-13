from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import secrets

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.services.email_service import send_email
from app.models.user import User
from app.schemas.auth import UserSignup, UserLogin


def signup_user(db: Session, payload: UserSignup) -> User:
    if payload.role == "admin" and not settings.ALLOW_ADMIN_SIGNUP:
        # The very first account may still bootstrap the system as admin.
        if db.query(User).count() > 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin accounts can only be created by an existing administrator",
            )
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, payload: UserLogin) -> User:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="This account is inactive"
        )
    return user


def build_token_for_user(user: User) -> str:
    return create_access_token(data={"sub": str(user.id), "role": user.role})


def create_reset_token(db: Session, email: str) -> str:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Don't reveal whether the email exists — same generic message either way.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email",
        )
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    db.commit()
    return token


def reset_password(db: Session, reset_token: str, new_password: str) -> None:
    user = db.query(User).filter(User.reset_token == reset_token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    user.hashed_password = hash_password(new_password)
    user.reset_token = None
    db.commit()


def request_password_reset(db: Session, email: str) -> dict:
    """Create a reset token. Emails a link when SMTP is configured, otherwise
    (development) returns the token so the flow can still be demonstrated."""
    token = create_reset_token(db, email)
    link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"
    sent = send_email(
        email,
        "Reset your BuildTrack password",
        f"Hello,\n\nUse the link below to choose a new password:\n{link}\n\n"
        "If you did not request this, you can ignore this email.",
    )
    if sent:
        return {"message": "A password reset link has been sent to your email.", "reset_token": None, "email_sent": True}
    return {"message": "Email service not configured (development mode). Use the token below.", "reset_token": token, "email_sent": False}


def update_profile(db: Session, user: User, full_name: str) -> User:
    user.full_name = full_name
    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user: User, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    user.hashed_password = hash_password(new_password)
    db.commit()
