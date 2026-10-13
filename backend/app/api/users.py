from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.auth import UserOut, UserAdminUpdate, UserDirectoryEntry
from app.core.dependencies import require_role
from app.models.user import User

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    return db.query(User).order_by(User.id).all()


@router.get("/directory", response_model=List[UserDirectoryEntry])
def user_directory(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "project_manager")),
):
    """Minimal id/name/role list, e.g. to pick a recipient for a notification."""
    return db.query(User).filter(User.is_active.is_(True)).order_by(User.full_name).all()


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id and (payload.is_active is False or (payload.role and payload.role != "admin")):
        raise HTTPException(status_code=400, detail="You cannot deactivate or demote your own account")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user
