from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Model


class Member(Model):
    __tablename__ = "members"

    fid: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    nickname: Mapped[str | None] = mapped_column(String(100), nullable=True)
    kid: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stove_lv: Mapped[int | None] = mapped_column(Integer, nullable=True)
    stove_lv_content: Mapped[str | None] = mapped_column(String(500), nullable=True)
    avatar_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    total_recharge_amount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
