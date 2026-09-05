"""
SQLAlchemy ORM models.

Importing this package registers every model class on `Base.metadata`,
which is required for `Base.metadata.create_all()` and for Alembic's
autogenerate support to see the full schema.
"""
from app.models.user import User, UserRole
from app.models.project import Project, ProjectCategory, ProjectStatus
from app.models.milestone import ProjectMilestone, MilestoneStatus
from app.models.resource import Resource, ResourceCategory, AvailabilityStatus
from app.models.inventory import Inventory, MaterialCategory
from app.models.worker import Worker, WorkerCategory, WorkerStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.procurement import Procurement, ProcurementCategory, ProcurementStatus
from app.models.notification import Notification, NotificationType
from app.models.report import Report, ReportType

__all__ = [
    "User",
    "UserRole",
    "Project",
    "ProjectCategory",
    "ProjectStatus",
    "ProjectMilestone",
    "MilestoneStatus",
    "Resource",
    "ResourceCategory",
    "AvailabilityStatus",
    "Inventory",
    "MaterialCategory",
    "Worker",
    "WorkerCategory",
    "WorkerStatus",
    "Attendance",
    "AttendanceStatus",
    "Procurement",
    "ProcurementCategory",
    "ProcurementStatus",
    "Notification",
    "NotificationType",
    "Report",
    "ReportType",
]
