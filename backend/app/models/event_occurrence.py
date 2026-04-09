from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Model


class EventOccurrence(Model):
    """A single event occurrence (actual start/end period). The basis for aggregation and participation."""

    __tablename__ = "event_occurrences"
    __table_args__ = (
        UniqueConstraint("event_id", "alliance_id", "period_start", name="uq_event_occurrence_event_alliance_period_start"),
    )

    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    alliance_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("alliances.id", ondelete="SET NULL"), nullable=True)
    period_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    period_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    event = relationship("Event", back_populates="occurrences")
    alliance = relationship("Alliance", foreign_keys=[alliance_id])
    participations = relationship(
        "EventParticipation", back_populates="occurrence", cascade="all, delete-orphan"
    )
