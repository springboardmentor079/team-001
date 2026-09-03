"""
User service — database operations for User model.
"""
from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from typing import Optional

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import PasswordResetToken, User
from app.schemas.user import UserCreate, UserUpdate


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email.lower()).first()


def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()


def create_user(db: Session, data: UserCreate) -> User:
    user = User(
        full_name=data.full_name.strip(),
        email=data.email.lower(),
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, data: UserUpdate) -> User:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()


def create_password_reset_token(db: Session, user: User) -> str:
    """Persist a hashed, short-lived reset token and return the raw value for delivery."""
    raw_token = secrets.token_urlsafe(48)
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None)
    ).update({"used_at": datetime.now(timezone.utc)})
    db.add(PasswordResetToken(
        user_id=user.id,
        token_hash=hashlib.sha256(raw_token.encode()).hexdigest(),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
    ))
    db.commit()
    return raw_token


def reset_password(db: Session, raw_token: str, password: str) -> bool:
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    reset = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at > datetime.now(timezone.utc),
    ).first()
    if not reset:
        return False
    reset.user.hashed_password = hash_password(password)
    reset.used_at = datetime.now(timezone.utc)
    db.commit()
    return True
