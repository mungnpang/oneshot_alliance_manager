"""add_performance_indexes

Revision ID: a1b2c3d4e5f6
Revises: fe8d2c1a4b5e
Create Date: 2026-04-09

"""
from typing import Sequence, Union

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "fe8d2c1a4b5e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fast lookup of participations by event
    op.create_index("ix_event_participations_event_id", "event_participations", ["event_id"])
    # Fast lookup of participations by occurrence
    op.create_index("ix_event_participations_occurrence_id", "event_participations", ["occurrence_id"])
    # Fast lookup of participations by member (used in /me/stats)
    op.create_index("ix_event_participations_member_id", "event_participations", ["member_id"])
    # Fast lookup of alliance members by alliance
    op.create_index("ix_alliance_members_alliance_id", "alliance_members", ["alliance_id"])
    # Fast range queries on occurrence period_start (calendar view)
    op.create_index("ix_event_occurrences_period_start", "event_occurrences", ["period_start"])


def downgrade() -> None:
    op.drop_index("ix_event_participations_event_id", table_name="event_participations")
    op.drop_index("ix_event_participations_occurrence_id", table_name="event_participations")
    op.drop_index("ix_event_participations_member_id", table_name="event_participations")
    op.drop_index("ix_alliance_members_alliance_id", table_name="alliance_members")
    op.drop_index("ix_event_occurrences_period_start", table_name="event_occurrences")
