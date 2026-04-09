from typing import Any

from sqlalchemy import BigInteger, Boolean, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Model


class EventParticipation(Model):
    __tablename__ = "event_participations"
    __table_args__ = (UniqueConstraint("occurrence_id", "member_id", name="uq_participation_occurrence_member"),)

    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id"), nullable=False)
    occurrence_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("event_occurrences.id", ondelete="CASCADE"), nullable=False
    )
    member_id: Mapped[int] = mapped_column(Integer, ForeignKey("members.id"), nullable=False)
    is_participated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    score: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    extra_info: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    event = relationship("Event", backref="participations")
    occurrence = relationship("EventOccurrence", back_populates="participations")
    member = relationship("Member", backref="event_participations")
