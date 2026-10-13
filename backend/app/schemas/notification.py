from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel

NotificationType = Literal[
    "project_update", "task_assignment", "procurement_alert", "attendance_alert",
    "deadline", "system"
]


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: Optional[str] = None
    type: NotificationType = "system"


class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: Optional[str]
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UnreadCount(BaseModel):
    unread: int


class AlertRunResult(BaseModel):
    deadline_alerts: int
    low_stock_alerts: int
