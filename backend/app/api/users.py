from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.schemas.auth import UserOut
from app.core.dependencies import require_role
from app.models.user import User

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Admin-only: list all registered users."""
    return db.query(User).all()
