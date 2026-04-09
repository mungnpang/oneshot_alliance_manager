"""event_occurrences and participation occurrence_id

Revision ID: c4d9e1b72a8f
Revises: fe8d2c1a4b5e
Create Date: 2026-04-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4d9e1b72a8f"
down_revision: Union[str, Sequence[str], None] = "fe8d2c1a4b5e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "event_occurrences",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("period_start", sa.DateTime(), nullable=False),
        sa.Column("period_end", sa.DateTime(), nullable=True),
        sa.Column("label", sa.String(length=100), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "period_start", name="uq_event_occurrence_event_period_start"),
    )
    op.create_index("ix_event_occurrences_event_id", "event_occurrences", ["event_id"])

    op.add_column("event_participations", sa.Column("occurrence_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "event_participations_occurrence_id_fkey",
        "event_participations",
        "event_occurrences",
        ["occurrence_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # 기존 (event_id, start_date) 조합마다 occurrence 1행 생성
    op.execute(
        sa.text("""
        INSERT INTO event_occurrences (event_id, period_start, period_end, label, note, created_at, updated_at)
        SELECT ep.event_id,
               ep.start_date,
               (SELECT MAX(ep2.end_date) FROM event_participations ep2
                WHERE ep2.event_id = ep.event_id AND ep2.start_date = ep.start_date),
               NULL, NULL, now(), now()
        FROM event_participations ep
        GROUP BY ep.event_id, ep.start_date
        """)
    )

    op.execute(
        sa.text("""
        UPDATE event_participations ep
        SET occurrence_id = eo.id
        FROM event_occurrences eo
        WHERE eo.event_id = ep.event_id AND eo.period_start = ep.start_date
        """)
    )

    op.alter_column("event_participations", "occurrence_id", existing_type=sa.Integer(), nullable=False)

    op.drop_constraint("uq_event_participation", "event_participations", type_="unique")
    op.create_unique_constraint(
        "uq_participation_occurrence_member",
        "event_participations",
        ["occurrence_id", "member_id"],
    )

    op.drop_column("event_participations", "end_date")
    op.drop_column("event_participations", "start_date")

    op.drop_constraint("event_participations_event_id_fkey", "event_participations", type_="foreignkey")
    op.create_foreign_key(
        "event_participations_event_id_fkey",
        "event_participations",
        "events",
        ["event_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("event_participations_event_id_fkey", "event_participations", type_="foreignkey")
    op.create_foreign_key(
        "event_participations_event_id_fkey",
        "event_participations",
        "events",
        ["event_id"],
        ["id"],
    )

    op.add_column("event_participations", sa.Column("start_date", sa.DateTime(), nullable=True))
    op.add_column("event_participations", sa.Column("end_date", sa.DateTime(), nullable=True))

    op.execute(
        sa.text("""
        UPDATE event_participations ep
        SET start_date = eo.period_start,
            end_date = eo.period_end
        FROM event_occurrences eo
        WHERE ep.occurrence_id = eo.id
        """)
    )

    op.alter_column("event_participations", "start_date", existing_type=sa.DateTime(), nullable=False)

    op.drop_constraint("uq_participation_occurrence_member", "event_participations", type_="unique")
    op.create_unique_constraint(
        "uq_event_participation",
        "event_participations",
        ["event_id", "member_id", "start_date"],
    )

    op.drop_constraint("event_participations_occurrence_id_fkey", "event_participations", type_="foreignkey")
    op.drop_column("event_participations", "occurrence_id")

    op.drop_index("ix_event_occurrences_event_id", table_name="event_occurrences")
    op.drop_table("event_occurrences")
