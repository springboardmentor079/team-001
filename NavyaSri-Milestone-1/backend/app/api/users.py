"""User profile management and admin user-management endpoints."""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, require_roles
from app.database.database import get_db
from app.models.user import User, UserRole
from app.schemas.common import APIResponse
from app.schemas.user import UserListResponse, UserProfileUpdate, UserResponse, UserStatusUpdate
from app.services import user_service
from app.utils.helpers import success_response

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=APIResponse[UserResponse], summary="Get my profile")
def get_my_profile(current_user: User = Depends(get_current_active_user)):
    return success_response("Profile retrieved.", UserResponse.model_validate(current_user))


@router.put("/profile", response_model=APIResponse[UserResponse], summary="Update my profile")
def update_my_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Update the caller's own profile.

    Only full_name, phone_number, and profile_image may be changed here.
    Role changes are intentionally not exposed on this endpoint — only an
    Administrator may change a user's role, via a dedicated admin action.
    """
    updated = user_service.update_profile(db, current_user, payload)
    return success_response("Profile updated successfully.", UserResponse.model_validate(updated))


@router.get(
    "",
    response_model=APIResponse[UserListResponse],
    summary="List users (Administrator only)",
)
def list_users(
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles([UserRole.ADMIN])),
):
    items, total = user_service.list_users(db, role=role, search=search, skip=skip, limit=limit)
    body = UserListResponse(total=total, items=[UserResponse.model_validate(u) for u in items])
    return success_response("Users retrieved.", body)


@router.get(
    "/{user_id}",
    response_model=APIResponse[UserResponse],
    summary="Get a user by id (Administrator only)",
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles([UserRole.ADMIN])),
):
    user = user_service.get_user_by_id(db, user_id)
    return success_response("User retrieved.", UserResponse.model_validate(user))


@router.put(
    "/{user_id}/status",
    response_model=APIResponse[UserResponse],
    summary="Activate or deactivate a user (Administrator only)",
)
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles([UserRole.ADMIN])),
):
    user = user_service.set_user_active_status(db, user_id, payload.is_active)
    state = "activated" if payload.is_active else "deactivated"
    return success_response(f"User {state} successfully.", UserResponse.model_validate(user))
