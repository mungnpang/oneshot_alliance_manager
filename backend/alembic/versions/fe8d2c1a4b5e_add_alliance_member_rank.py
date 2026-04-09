"""add_alliance_member_rank

Revision ID: fe8d2c1a4b5e
Revises: 199ed134abba
Create Date: 2026-04-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "fe8d2c1a4b5e"
down_revision: Union[str, Sequence[str], None] = "199ed134abba"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(sa.text("CREATE TYPE alliance_rank AS ENUM ('R1', 'R2', 'R3', 'R4', 'R5')"))
    alliance_rank_enum = postgresql.ENUM(
        "R1", "R2", "R3", "R4", "R5", name="alliance_rank", create_type=False
    )
    op.add_column(
        "alliance_members",
        sa.Column(
            "rank",
            alliance_rank_enum,
            server_default=sa.text("'R1'::alliance_rank"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("alliance_members", "rank")
    op.execute(sa.text("DROP TYPE alliance_rank"))
