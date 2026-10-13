from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User
from app.schemas.notification import (
    NotificationCreate, NotificationOut, UnreadCount, AlertRunResult,
)
from app.services import notification_service

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("/", response_model=list[NotificationOut])
def list_my_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return notification_service.list_notifications_for_user(db, current_user.id)


@router.get("/unread-count", response_model=UnreadCount)
def unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return UnreadCount(unread=notification_service.unread_count(db, current_user.id))


@router.post("/", response_model=NotificationOut, status_code=201)
def create_notification(
    payload: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "project_manager")),
):
    return notification_service.create_notification(db, payload)


@router.post("/generate-alerts", response_model=AlertRunResult)
def generate_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "project_manager")),
):
    """Scan milestones and inventory and raise deadline / low-stock notifications."""
    return notification_service.generate_alerts(db)


@router.patch("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    updated = notification_service.mark_all_read(db, current_user.id)
    return {"marked_read": updated}


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return notification_service.mark_as_read(db, notification_id, current_user.id)
