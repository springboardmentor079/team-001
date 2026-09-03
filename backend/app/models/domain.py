"""Milestone 1 database schema for BuildTrack's remaining domain tables.

These models intentionally establish the data contract before their Milestone 2/3
workflows and API endpoints are implemented.
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class ProjectMilestone(Base):
    __tablename__ = "project_milestones"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    due_date = Column(Date, nullable=True)
    status = Column(String(40), nullable=False, default="pending")
    completion_percent = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    category = Column(String(80), nullable=False)
    quantity_available = Column(Integer, nullable=False, default=0)
    status = Column(String(40), nullable=False, default="available")
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class InventoryItem(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    category = Column(String(80), nullable=False)
    unit = Column(String(40), nullable=False)
    quantity_in_stock = Column(Numeric(12, 2), nullable=False, default=0)
    reorder_level = Column(Numeric(12, 2), nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class Worker(Base):
    __tablename__ = "workers"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True)
    employee_code = Column(String(50), unique=True, nullable=False)
    trade = Column(String(100), nullable=True)
    employment_status = Column(String(40), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True)
    attendance_date = Column(Date, nullable=False, index=True)
    status = Column(String(20), nullable=False)
    check_in_at = Column(DateTime(timezone=True), nullable=True)
    check_out_at = Column(DateTime(timezone=True), nullable=True)


class Procurement(Base):
    __tablename__ = "procurements"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    vendor_name = Column(String(200), nullable=False)
    request_type = Column(String(80), nullable=False)
    status = Column(String(40), nullable=False, default="draft")
    total_amount = Column(Numeric(14, 2), nullable=False, default=0)
    requested_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False, default="system")
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    report_type = Column(String(80), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    generated_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
