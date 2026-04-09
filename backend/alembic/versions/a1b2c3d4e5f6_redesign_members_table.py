"""redesign members table for kingshot auth

Revision ID: a1b2c3d4e5f6
Revises: cc4624e93643
Create Date: 2026-04-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'cc4624e93643'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # snapshots has FK to members, drop it first
    op.drop_table("snapshots")
    op.drop_table("members")

    op.create_table(
        "members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("fid", sa.Integer(), nullable=False),
        sa.Column("nickname", sa.String(100), nullable=True),
        sa.Column("kid", sa.Integer(), nullable=True),
        sa.Column("stove_lv", sa.Integer(), nullable=True),
        sa.Column("stove_lv_content", sa.String(500), nullable=True),
        sa.Column("avatar_image", sa.String(500), nullable=True),
        sa.Column("total_recharge_amount", sa.Integer(), nullable=True),
        sa.Column("hashed_password", sa.String(256), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("fid"),
    )

    op.create_table(
        "snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("member_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("screenshot", sa.String(500), nullable=True),
        sa.Column("captured_at", sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["member_id"], ["members.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("snapshots")
    op.drop_table("members")

    op.create_table(
        "members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("member_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("screenshot", sa.String(500), nullable=True),
        sa.Column("captured_at", sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["member_id"], ["members.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
