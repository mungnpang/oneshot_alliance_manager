from sqlalchemy import Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Model


class Event(Model):
    __tablename__ = "events"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    eval_weight: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    occurrences = relationship(
        "EventOccurrence", back_populates="event", cascade="all, delete-orphan"
    )
