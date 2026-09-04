"""
Authentication endpoints: register, login, current user, forgot/reset
password.
"""
from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_active_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.common import APIResponse
from app.schemas.user import UserResponse
from app.services import auth_service
from app.utils.helpers import success_response

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=APIResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Create a new account. Email must be unique; password is hashed with bcrypt."""
    user = auth_service.register_user(db, payload)
    return success_response(
        "Account created successfully. You may now log in.", UserResponse.model_validate(user)
    )


@router.post("/login", response_model=APIResponse[TokenResponse], summary="Log in with email and password")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """JSON login endpoint used by the Angular frontend."""
    user, token = auth_service.login_user(db, payload)
    token_response = TokenResponse(access_token=token, user=UserResponse.model_validate(user))
    return success_response("Login successful.", token_response)


@router.post(
    "/login/oauth",
    response_model=APIResponse[TokenResponse],
    summary="OAuth2-compatible token login (for Swagger 'Authorize' button)",
)
def login_oauth2(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Standard OAuth2 password-flow endpoint (username = email). This exists
    so the Swagger UI's built-in "Authorize" button works out of the box;
    the Angular app uses the plain JSON `/auth/login` endpoint above.
    """
    login_payload = LoginRequest(email=form_data.username, password=form_data.password)
    user, token = auth_service.login_user(db, login_payload)
    token_response = TokenResponse(access_token=token, user=UserResponse.model_validate(user))
    return success_response("Login successful.", token_response)


@router.get("/me", response_model=APIResponse[UserResponse], summary="Get the current authenticated user")
def get_me(current_user: User = Depends(get_current_active_user)):
    return success_response("Current user retrieved.", UserResponse.model_validate(current_user))


@router.post("/logout", response_model=APIResponse, summary="Log out the current session")
def logout(current_user: User = Depends(get_current_active_user)):
    """
    Stateless JWT logout.

    The frontend is responsible for discarding the token. This endpoint is
    provided for API completeness and as the natural extension point for a
    future token-blacklist implementation.
    """
    return success_response("Logged out successfully. Please discard your access token.")


@router.post(
    "/forgot-password",
    response_model=APIResponse[ForgotPasswordResponse],
    summary="Request a password reset token",
)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generate a password reset token.

    For Milestone 1 there is no SMTP integration, so — purely for local
    development and demonstration — the token is returned directly in the
    response instead of being emailed. The architecture (a short-lived JWT
    with a distinct `type` claim) is ready for a real email service to be
    plugged in later without changing the API contract.
    """
    token = auth_service.request_password_reset(db, payload.email)

    if token is None:
        # Do not reveal whether the email exists.
        body = ForgotPasswordResponse(
            message="If an account with that email exists, password reset instructions have been sent."
        )
        return success_response(body.message, body)

    body = ForgotPasswordResponse(
        message=(
            "Password reset token generated. (Development mode: token is returned directly "
            "below instead of being emailed.)"
        ),
        reset_token=token,
        expires_in_minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES,
    )
    return success_response(body.message, body)


@router.post(
    "/reset-password",
    response_model=APIResponse[UserResponse],
    summary="Reset password using a reset token",
)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = auth_service.reset_password(db, payload)
    return success_response(
        "Password has been reset successfully. You may now log in with your new password.",
        UserResponse.model_validate(user),
    )
