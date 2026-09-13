"""
Shared FastAPI dependencies: current-user resolution and role-based
authorization guards.
"""
from typing import Iterable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database.database import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Resolve the currently authenticated user from the bearer JWT.

    Raises HTTP 401 if the token is missing, invalid, expired, or no
    longer corresponds to an existing user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the resolved user account is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account. Please contact an administrator.",
        )
    return current_user


def require_roles(allowed_roles: Iterable[UserRole]):
    """
    Dependency factory returning a dependency that only allows the given
    roles through. Usage:

        @router.get("/admin-only")
        def endpoint(user: User = Depends(require_roles([UserRole.ADMIN]))):
            ...
    """
    allowed = set(allowed_roles)

    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return role_checker
