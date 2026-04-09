"""add_thumbnail_url_to_events

Revision ID: 27bcc5a1bdf3
Revises: e2a3b4c5d6e7
Create Date: 2026-04-04 21:11:28.842835

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '27bcc5a1bdf3'
down_revision: Union[str, Sequence[str], None] = 'e2a3b4c5d6e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('events', sa.Column('thumbnail_url', sa.String(length=512), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('events', 'thumbnail_url')
