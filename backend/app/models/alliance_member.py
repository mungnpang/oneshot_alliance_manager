import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Model


class AllianceRank(str, enum.Enum):
    R1 = "R1"
    R2 = "R2"
    R3 = "R3"
    R4 = "R4"
    R5 = "R5"


class AllianceMember(Model):
    __tablename__ = "alliance_members"
    __table_args__ = (UniqueConstraint("member_id", name="uq_alliance_members_member_id"),)

    alliance_id: Mapped[int] = mapped_column(Integer, ForeignKey("alliances.id"), nullable=False)
    member_id: Mapped[int] = mapped_column(Integer, ForeignKey("members.id"), nullable=False)
    rank: Mapped[AllianceRank] = mapped_column(
        Enum(AllianceRank, name="alliance_rank"),
        nullable=False,
        default=AllianceRank.R1,
    )
    joined_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    alliance = relationship("Alliance", back_populates="alliance_members")
    member = relationship("Member", backref="alliance_membership")
