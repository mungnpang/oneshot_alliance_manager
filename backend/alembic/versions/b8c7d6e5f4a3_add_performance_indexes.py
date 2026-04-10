"""add_performance_indexes

Revision ID: b8c7d6e5f4a3
Revises: 5fde9011f622
Create Date: 2026-04-09

Note: occurrence_id-only index omitted — covered by uq_participation_occurrence_member (occurrence_id, member_id).
"""
from typing import Sequence, Union

from alembic import op

revision: str = "b8c7d6e5f4a3"
down_revision: Union[str, Sequence[str], None] = "5fde9011f622"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_event_participations_event_id", "event_participations", ["event_id"])
    op.create_index("ix_event_participations_member_id", "event_participations", ["member_id"])
    op.create_index(
        "ix_event_participations_member_participated",
        "event_participations",
        ["member_id", "is_participated"],
    )
    op.create_index("ix_alliance_members_alliance_id", "alliance_members", ["alliance_id"])
    op.create_index("ix_event_occurrences_period_start", "event_occurrences", ["period_start"])
    op.create_index("ix_event_occurrences_event_id", "event_occurrences", ["event_id"])


def downgrade() -> None:
    op.drop_index("ix_event_occurrences_event_id", table_name="event_occurrences")
    op.drop_index("ix_event_occurrences_period_start", table_name="event_occurrences")
    op.drop_index("ix_alliance_members_alliance_id", table_name="alliance_members")
    op.drop_index("ix_event_participations_member_participated", table_name="event_participations")
    op.drop_index("ix_event_participations_member_id", table_name="event_participations")
    op.drop_index("ix_event_participations_event_id", table_name="event_participations")
