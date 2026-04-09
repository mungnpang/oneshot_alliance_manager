"""remove events.frequency; add created_at/updated_at to snapshots, alliance_members, event_participations

Revision ID: e2a3b4c5d6e7
Revises: c4d9e1b72a8f
Create Date: 2026-04-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e2a3b4c5d6e7"
down_revision: Union[str, Sequence[str], None] = "c4d9e1b72a8f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("events", "frequency")
    op.execute(sa.text("DROP TYPE IF EXISTS frequency"))

    op.add_column(
        "snapshots",
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
    )
    op.add_column(
        "snapshots",
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
    )
    op.add_column(
        "alliance_members",
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
    )
    op.add_column(
        "alliance_members",
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
    )
    op.add_column(
        "event_participations",
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
    )
    op.add_column(
        "event_participations",
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("event_participations", "updated_at")
    op.drop_column("event_participations", "created_at")
    op.drop_column("alliance_members", "updated_at")
    op.drop_column("alliance_members", "created_at")
    op.drop_column("snapshots", "updated_at")
    op.drop_column("snapshots", "created_at")

    frequency_enum = sa.Enum("daily", "weekly", "monthly", "others", name="frequency")
    frequency_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "events",
        sa.Column(
            "frequency",
            frequency_enum,
            nullable=False,
            server_default=sa.text("'weekly'::frequency"),
        ),
    )
    op.alter_column("events", "frequency", server_default=None)
