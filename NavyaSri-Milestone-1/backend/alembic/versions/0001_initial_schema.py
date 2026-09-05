"""Initial schema — all Milestone 1 tables.

Creates: users, projects, project_milestones, resources, inventory,
workers, attendance, procurements, notifications, reports.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-01-15
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # users
    # ------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            sa.Enum(
                "ADMIN",
                "PROJECT_MANAGER",
                "SITE_ENGINEER",
                "CONTRACTOR",
                "WORKER",
                "CLIENT",
                name="userrole",
            ),
            nullable=False,
        ),
        sa.Column("phone_number", sa.String(length=30), nullable=True),
        sa.Column("profile_image", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_role", "users", ["role"])

    # ------------------------------------------------------------------
    # projects
    # ------------------------------------------------------------------
    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("project_name", sa.String(length=200), nullable=False),
        sa.Column("project_code", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "category",
            sa.Enum(
                "RESIDENTIAL",
                "COMMERCIAL",
                "INDUSTRIAL",
                "INFRASTRUCTURE",
                "GOVERNMENT",
                name="projectcategory",
            ),
            nullable=False,
        ),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("expected_end_date", sa.Date(), nullable=True),
        sa.Column("actual_end_date", sa.Date(), nullable=True),
        sa.Column("budget", sa.Numeric(14, 2), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "PLANNED",
                "IN_PROGRESS",
                "ON_HOLD",
                "COMPLETED",
                "CANCELLED",
                name="projectstatus",
            ),
            nullable=False,
            server_default="PLANNED",
        ),
        sa.Column(
            "project_manager_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "client_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_projects_id", "projects", ["id"])
    op.create_index("ix_projects_project_code", "projects", ["project_code"], unique=True)
    op.create_index("ix_projects_project_manager_id", "projects", ["project_manager_id"])
    op.create_index("ix_projects_client_id", "projects", ["client_id"])

    # ------------------------------------------------------------------
    # project_milestones
    # ------------------------------------------------------------------
    op.create_table(
        "project_milestones",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "project_id",
            sa.Integer(),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("planned_start_date", sa.Date(), nullable=True),
        sa.Column("planned_end_date", sa.Date(), nullable=True),
        sa.Column("actual_completion_date", sa.Date(), nullable=True),
        sa.Column("progress_percentage", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "status",
            sa.Enum(
                "NOT_STARTED", "IN_PROGRESS", "COMPLETED", "DELAYED", name="milestonestatus"
            ),
            nullable=False,
            server_default="NOT_STARTED",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_project_milestones_id", "project_milestones", ["id"])
    op.create_index("ix_project_milestones_project_id", "project_milestones", ["project_id"])

    # ------------------------------------------------------------------
    # resources
    # ------------------------------------------------------------------
    op.create_table(
        "resources",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column(
            "category",
            sa.Enum(
                "EXCAVATORS",
                "CONCRETE_MIXERS",
                "CRANES",
                "DUMP_TRUCKS",
                "GENERATORS",
                "SAFETY_EQUIPMENT",
                name="resourcecategory",
            ),
            nullable=False,
        ),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "availability_status",
            sa.Enum(
                "AVAILABLE",
                "IN_USE",
                "UNDER_MAINTENANCE",
                "OUT_OF_SERVICE",
                name="availabilitystatus",
            ),
            nullable=False,
            server_default="AVAILABLE",
        ),
        sa.Column("utilization_percentage", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column(
            "assigned_project_id",
            sa.Integer(),
            sa.ForeignKey("projects.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("maintenance_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_resources_id", "resources", ["id"])
    op.create_index("ix_resources_assigned_project_id", "resources", ["assigned_project_id"])

    # ------------------------------------------------------------------
    # inventory
    # ------------------------------------------------------------------
    op.create_table(
        "inventory",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("material_name", sa.String(length=150), nullable=False),
        sa.Column(
            "category",
            sa.Enum(
                "CEMENT",
                "STEEL",
                "BRICKS",
                "SAND",
                "CONCRETE",
                "ELECTRICAL_MATERIALS",
                "PLUMBING_MATERIALS",
                name="materialcategory",
            ),
            nullable=False,
        ),
        sa.Column("quantity_available", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("minimum_stock_level", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("unit", sa.String(length=20), nullable=False, server_default="units"),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("last_updated", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_inventory_id", "inventory", ["id"])

    # ------------------------------------------------------------------
    # workers
    # ------------------------------------------------------------------
    op.create_table(
        "workers",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "worker_category",
            sa.Enum(
                "ENGINEERS",
                "SUPERVISORS",
                "CONTRACTORS",
                "SKILLED_WORKERS",
                "UNSKILLED_WORKERS",
                "CONSULTANTS",
                name="workercategory",
            ),
            nullable=False,
        ),
        sa.Column("skill", sa.String(length=150), nullable=True),
        sa.Column(
            "assigned_project_id",
            sa.Integer(),
            sa.ForeignKey("projects.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("joining_date", sa.Date(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("ACTIVE", "ON_LEAVE", "RELEASED", name="workerstatus"),
            nullable=False,
            server_default="ACTIVE",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_workers_id", "workers", ["id"])
    op.create_index("ix_workers_user_id", "workers", ["user_id"], unique=True)
    op.create_index("ix_workers_assigned_project_id", "workers", ["assigned_project_id"])

    # ------------------------------------------------------------------
    # attendance
    # ------------------------------------------------------------------
    op.create_table(
        "attendance",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "worker_id",
            sa.Integer(),
            sa.ForeignKey("workers.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "project_id",
            sa.Integer(),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("attendance_date", sa.Date(), nullable=False),
        sa.Column("check_in", sa.DateTime(timezone=True), nullable=True),
        sa.Column("check_out", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "status",
            sa.Enum("PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", name="attendancestatus"),
            nullable=False,
            server_default="PRESENT",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_attendance_id", "attendance", ["id"])
    op.create_index("ix_attendance_worker_id", "attendance", ["worker_id"])
    op.create_index("ix_attendance_project_id", "attendance", ["project_id"])
    op.create_index("ix_attendance_attendance_date", "attendance", ["attendance_date"])

    # ------------------------------------------------------------------
    # procurements
    # ------------------------------------------------------------------
    op.create_table(
        "procurements",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "project_id",
            sa.Integer(),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("item_name", sa.String(length=200), nullable=False),
        sa.Column(
            "category",
            sa.Enum(
                "RAW_MATERIALS",
                "EQUIPMENT",
                "MACHINERY",
                "SAFETY_EQUIPMENT",
                "OFFICE_SUPPLIES",
                name="procurementcategory",
            ),
            nullable=False,
        ),
        sa.Column("vendor_name", sa.String(length=200), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("estimated_cost", sa.Numeric(14, 2), nullable=True),
        sa.Column("actual_cost", sa.Numeric(14, 2), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "REQUESTED",
                "APPROVED",
                "ORDERED",
                "DELIVERED",
                "REJECTED",
                name="procurementstatus",
            ),
            nullable=False,
            server_default="REQUESTED",
        ),
        sa.Column("request_date", sa.Date(), nullable=True),
        sa.Column("expected_delivery_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_procurements_id", "procurements", ["id"])
    op.create_index("ix_procurements_project_id", "procurements", ["project_id"])

    # ------------------------------------------------------------------
    # notifications
    # ------------------------------------------------------------------
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column(
            "notification_type",
            sa.Enum("INFO", "WARNING", "ALERT", "SUCCESS", name="notificationtype"),
            nullable=False,
            server_default="INFO",
        ),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_notifications_id", "notifications", ["id"])
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])

    # ------------------------------------------------------------------
    # reports
    # ------------------------------------------------------------------
    op.create_table(
        "reports",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "project_id",
            sa.Integer(),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "report_type",
            sa.Enum("PROGRESS", "FINANCIAL", "RESOURCE", "SAFETY", "CUSTOM", name="reporttype"),
            nullable=False,
            server_default="CUSTOM",
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column(
            "generated_by",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("file_path", sa.String(length=500), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_reports_id", "reports", ["id"])
    op.create_index("ix_reports_project_id", "reports", ["project_id"])


def downgrade() -> None:
    op.drop_table("reports")
    op.drop_table("notifications")
    op.drop_table("procurements")
    op.drop_table("attendance")
    op.drop_table("workers")
    op.drop_table("inventory")
    op.drop_table("resources")
    op.drop_table("project_milestones")
    op.drop_table("projects")
    op.drop_table("users")

    # Drop native enum types (PostgreSQL only — no-op on SQLite).
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        for enum_name in [
            "userrole",
            "projectcategory",
            "projectstatus",
            "milestonestatus",
            "resourcecategory",
            "availabilitystatus",
            "materialcategory",
            "workercategory",
            "workerstatus",
            "attendancestatus",
            "procurementcategory",
            "procurementstatus",
            "notificationtype",
            "reporttype",
        ]:
            sa.Enum(name=enum_name).drop(bind, checkfirst=True)
