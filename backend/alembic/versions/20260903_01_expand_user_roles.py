"""Align legacy userrole enum values with the BuildTrack role model.

Revision ID: 20260903_01
Revises: 20260902_01
Create Date: 2026-09-03
"""
from alembic import op
import sqlalchemy as sa


revision = "20260903_01"
down_revision = "20260902_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    def enum_labels() -> set[str]:
        return set(bind.execute(sa.text("""
            SELECT enumlabel
            FROM pg_enum
            JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
            WHERE pg_type.typname = 'userrole'
        """)).scalars())

    labels = enum_labels()
    missing_roles = [role for role in ("contractor", "worker", "client") if role not in labels]
    if missing_roles:
        # PostgreSQL only permits a newly added enum value to be used after the
        # transaction that added it has committed.
        with op.get_context().autocommit_block():
            for role in missing_roles:
                op.execute(f"ALTER TYPE userrole ADD VALUE '{role}'")
        labels = enum_labels()

    if "viewer" in labels:
        op.execute("UPDATE users SET role = 'client'::userrole WHERE role = 'viewer'::userrole")

    op.execute("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'client'::userrole")


def downgrade() -> None:
    # PostgreSQL does not support removing enum labels. Preserve existing data.
    op.execute("ALTER TABLE users ALTER COLUMN role DROP DEFAULT")
