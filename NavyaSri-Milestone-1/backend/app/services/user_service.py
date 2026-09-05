"""User profile and admin user-management business logic."""
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.schemas.user import UserProfileUpdate


def update_profile(db: Session, user: User, payload: UserProfileUpdate) -> User:
    """Update the mutable, self-service fields on a user's own profile."""
    if payload.full_name is not None:
        user.full_name = payload.full_name.strip()
    if payload.phone_number is not None:
        user.phone_number = payload.phone_number
    if payload.profile_image is not None:
        user.profile_image = payload.profile_image

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_users(
    db: Session,
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[User], int]:
    """List users with optional role filter and name/email search (admin only)."""
    query = db.query(User)

    if role is not None:
        query = query.filter(User.role == role)

    if search:
        like_term = f"%{search.strip()}%"
        query = query.filter(or_(User.full_name.ilike(like_term), User.email.ilike(like_term)))

    total = query.count()
    items = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_user_by_id(db: Session, user_id: int) -> User:
    """Fetch a single user by id. Raises HTTP 404 if not found."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


def set_user_active_status(db: Session, user_id: int, is_active: bool) -> User:
    """Activate or deactivate a user account (admin only)."""
    user = get_user_by_id(db, user_id)
    user.is_active = is_active
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
