from datetime import date, timedelta
from typing import Iterable, Optional

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.milestone import ProjectMilestone
from app.models.notification import Notification
from app.models.project import Project
from app.models.user import User
from app.schemas.notification import NotificationCreate
from app.services.email_service import send_email


def create_notification(db: Session, payload: NotificationCreate) -> Notification:
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Target user not found")
    notification = Notification(**payload.model_dump())
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def notify_user(
    db: Session,
    user_id: Optional[int],
    title: str,
    message: str,
    type_: str = "system",
    email: bool = False,
    dedupe: bool = False,
) -> Optional[Notification]:
    """Create an in-app notification (and optionally email it). Never raises."""
    if not user_id:
        return None
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        return None

    if dedupe:
        exists = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.title == title,
                Notification.message == message,
                Notification.is_read.is_(False),
            )
            .first()
        )
        if exists:
            return None

    notification = Notification(user_id=user_id, title=title, message=message, type=type_)
    db.add(notification)
    db.commit()
    db.refresh(notification)

    if email:
        send_email(user.email, f"[BuildTrack] {title}", message)
    return notification


def notify_roles(
    db: Session,
    roles: Iterable[str],
    title: str,
    message: str,
    type_: str = "system",
    exclude_user_id: Optional[int] = None,
    email: bool = False,
    dedupe: bool = False,
) -> int:
    users = db.query(User).filter(User.role.in_(list(roles)), User.is_active.is_(True)).all()
    count = 0
    for user in users:
        if exclude_user_id and user.id == exclude_user_id:
            continue
        if notify_user(db, user.id, title, message, type_, email=email, dedupe=dedupe):
            count += 1
    return count


def list_notifications_for_user(db: Session, user_id: int) -> list[Notification]:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .all()
    )


def unread_count(db: Session, user_id: int) -> int:
    return (
        db.query(func.count(Notification.id))
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .scalar()
        or 0
    )


def mark_as_read(db: Session, notification_id: int, user_id: int) -> Notification:
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_read(db: Session, user_id: int) -> int:
    updated = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .update({Notification.is_read: True})
    )
    db.commit()
    return updated


def generate_alerts(db: Session, days_ahead: int = 3) -> dict:
    """Scan the data and raise deadline + low-stock notifications.

    Safe to call repeatedly: identical unread alerts are not duplicated.
    """
    today = date.today()
    horizon = today + timedelta(days=days_ahead)
    deadline_alerts = 0
    stock_alerts = 0

    milestones = (
        db.query(ProjectMilestone)
        .filter(
            ProjectMilestone.due_date.isnot(None),
            ProjectMilestone.due_date <= horizon,
            ProjectMilestone.status.notin_(["completed"]),
        )
        .all()
    )
    for m in milestones:
        project = db.query(Project).filter(Project.id == m.project_id).first()
        if not project:
            continue
        overdue = m.due_date < today
        title = "Milestone overdue" if overdue else "Milestone deadline approaching"
        message = f"'{m.title}' in project '{project.name}' is due {m.due_date.isoformat()}."
        if overdue and m.status == "pending":
            m.status = "delayed"
            db.commit()
        targets = {project.manager_id} if project.manager_id else set()
        for uid in targets:
            if notify_user(db, uid, title, message, "deadline", email=True, dedupe=True):
                deadline_alerts += 1

    low_items = db.query(Inventory).filter(Inventory.quantity <= Inventory.reorder_level).all()
    for item in low_items:
        message = (
            f"{item.material_name} is at {float(item.quantity):g} {item.unit} "
            f"(reorder level {float(item.reorder_level):g})."
        )
        stock_alerts += notify_roles(
            db, ["admin", "project_manager"], "Low stock alert", message,
            "procurement_alert", dedupe=True,
        )

    return {"deadline_alerts": deadline_alerts, "low_stock_alerts": stock_alerts}
