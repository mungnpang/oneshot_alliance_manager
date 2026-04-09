"""add_alliance_id_to_event_occurrences

Revision ID: f3a2b1c0d9e8
Revises: 27bcc5a1bdf3
Create Date: 2026-04-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f3a2b1c0d9e8'
down_revision: Union[str, Sequence[str], None] = '27bcc5a1bdf3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add alliance_id column
    op.add_column(
        'event_occurrences',
        sa.Column('alliance_id', sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        'fk_event_occurrences_alliance_id',
        'event_occurrences', 'alliances',
        ['alliance_id'], ['id'],
        ondelete='SET NULL'
    )

    # Drop old unique constraint and create new one including alliance_id
    op.drop_constraint('uq_event_occurrence_event_period_start', 'event_occurrences', type_='unique')
    op.create_unique_constraint(
        'uq_event_occurrence_event_alliance_period_start',
        'event_occurrences',
        ['event_id', 'alliance_id', 'period_start']
    )


def downgrade() -> None:
    op.drop_constraint('uq_event_occurrence_event_alliance_period_start', 'event_occurrences', type_='unique')
    op.create_unique_constraint(
        'uq_event_occurrence_event_period_start',
        'event_occurrences',
        ['event_id', 'period_start']
    )
    op.drop_constraint('fk_event_occurrences_alliance_id', 'event_occurrences', type_='foreignkey')
    op.drop_column('event_occurrences', 'alliance_id')
