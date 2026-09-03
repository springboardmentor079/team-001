"""Create the finalized Milestone 1 BuildTrack schema.

Revision ID: 20260902_01
Revises:
Create Date: 2026-09-02
"""
from alembic import context, op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260902_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # PostgreSQL enum types are schema objects.  Create them explicitly with
    # checkfirst=True, then tell the table DDL not to create them a second time.
    # This also safely resumes a migration after a previous interrupted run.
    user_role = postgresql.ENUM("admin", "project_manager", "site_engineer", "contractor", "worker", "client", name="userrole", create_type=False)
    project_status = postgresql.ENUM("planning", "active", "on_hold", "completed", "cancelled", name="projectstatus", create_type=False)
    task_status = postgresql.ENUM("pending", "in_progress", "completed", "blocked", name="taskstatus", create_type=False)
    task_priority = postgresql.ENUM("low", "medium", "high", "critical", name="taskpriority", create_type=False)
    bind = op.get_bind()
    # Earlier development runs created users/projects/tasks with create_all.
    # Let this initial revision retain those tables and create the remaining
    # schema, while still creating every table in a fresh database.
    existing_tables = set() if context.is_offline_mode() else set(sa.inspect(bind).get_table_names())

    def create_table_if_missing(name, *columns):
        if name not in existing_tables:
            op.create_table(name, *columns)

    user_role.create(bind, checkfirst=True)
    project_status.create(bind, checkfirst=True)
    task_status.create(bind, checkfirst=True)
    task_priority.create(bind, checkfirst=True)
    create_table_if_missing("users", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("full_name", sa.String(150), nullable=False), sa.Column("email", sa.String(255), nullable=False, unique=True), sa.Column("hashed_password", sa.String(255), nullable=False), sa.Column("role", user_role, nullable=False, server_default="client"), sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    if "users" not in existing_tables: op.create_index("ix_users_email", "users", ["email"])
    create_table_if_missing("projects", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("name", sa.String(200), nullable=False), sa.Column("description", sa.Text()), sa.Column("location", sa.String(300)), sa.Column("status", project_status, nullable=False), sa.Column("start_date", sa.Date()), sa.Column("end_date", sa.Date()), sa.Column("manager_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    create_table_if_missing("tasks", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("title", sa.String(200), nullable=False), sa.Column("description", sa.Text()), sa.Column("status", task_status, nullable=False), sa.Column("priority", task_priority, nullable=False), sa.Column("due_date", sa.Date()), sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False), sa.Column("assigned_to", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    create_table_if_missing("project_milestones", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False), sa.Column("name", sa.String(200), nullable=False), sa.Column("due_date", sa.Date()), sa.Column("status", sa.String(40), nullable=False), sa.Column("completion_percent", sa.Integer(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    create_table_if_missing("resources", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("name", sa.String(200), nullable=False), sa.Column("category", sa.String(80), nullable=False), sa.Column("quantity_available", sa.Integer(), nullable=False), sa.Column("status", sa.String(40), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    create_table_if_missing("inventory", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("name", sa.String(200), nullable=False), sa.Column("category", sa.String(80), nullable=False), sa.Column("unit", sa.String(40), nullable=False), sa.Column("quantity_in_stock", sa.Numeric(12, 2), nullable=False), sa.Column("reorder_level", sa.Numeric(12, 2), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False))
    create_table_if_missing("workers", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), unique=True), sa.Column("employee_code", sa.String(50), nullable=False, unique=True), sa.Column("trade", sa.String(100)), sa.Column("employment_status", sa.String(40), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    create_table_if_missing("attendance", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("worker_id", sa.Integer(), sa.ForeignKey("workers.id", ondelete="CASCADE"), nullable=False), sa.Column("attendance_date", sa.Date(), nullable=False), sa.Column("status", sa.String(20), nullable=False), sa.Column("check_in_at", sa.DateTime(timezone=True)), sa.Column("check_out_at", sa.DateTime(timezone=True)))
    create_table_if_missing("procurements", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="SET NULL")), sa.Column("vendor_name", sa.String(200), nullable=False), sa.Column("request_type", sa.String(80), nullable=False), sa.Column("status", sa.String(40), nullable=False), sa.Column("total_amount", sa.Numeric(14, 2), nullable=False), sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False))
    create_table_if_missing("notifications", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("title", sa.String(200), nullable=False), sa.Column("message", sa.Text(), nullable=False), sa.Column("notification_type", sa.String(50), nullable=False), sa.Column("is_read", sa.Boolean(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    create_table_if_missing("reports", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("project_id", sa.Integer(), sa.ForeignKey("projects.id", ondelete="SET NULL")), sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("report_type", sa.String(80), nullable=False), sa.Column("title", sa.String(200), nullable=False), sa.Column("content", sa.Text()), sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False))
    create_table_if_missing("password_reset_tokens", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("token_hash", sa.String(64), nullable=False, unique=True), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False), sa.Column("used_at", sa.DateTime(timezone=True)), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))


def downgrade():
    for table in ("password_reset_tokens", "reports", "notifications", "procurements", "attendance", "workers", "inventory", "resources", "project_milestones", "tasks", "projects", "users"):
        op.drop_table(table)
    sa.Enum(name="userrole").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="projectstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="taskstatus").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="taskpriority").drop(op.get_bind(), checkfirst=True)
