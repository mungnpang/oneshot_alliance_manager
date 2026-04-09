from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Model


class Alliance(Model):
    __tablename__ = "alliances"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    alias: Mapped[str] = mapped_column(String(20), nullable=False)
    kid: Mapped[int] = mapped_column(Integer, nullable=False)
    leader_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("members.id"), nullable=True)
    power: Mapped[int | None] = mapped_column(Integer, nullable=True)
    num_member: Mapped[int | None] = mapped_column(Integer, nullable=True)
    language: Mapped[str | None] = mapped_column(String(50), nullable=True)

    leader = relationship("Member", foreign_keys=[leader_id])
    alliance_members = relationship("AllianceMember", back_populates="alliance", cascade="all, delete-orphan")
