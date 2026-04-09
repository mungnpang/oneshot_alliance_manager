from sqlalchemy.orm import Session

from app.core.exceptions import AuthException, KingshotAPIException
from app.core.security import create_access_token, hash_password, verify_password
from app.models.member import Member
from app.services.kingshot_service import fetch_player


async def register(fid: int, db: Session) -> Member:
    if db.query(Member).filter(Member.fid == fid).first():
        raise AuthException("FID already registered")

    player = await fetch_player(fid)

    member = Member(
        fid=fid,
        nickname=player.get("nickname"),
        kid=player.get("kid"),
        stove_lv=player.get("stove_lv"),
        stove_lv_content=player.get("stove_lv_content"),
        avatar_image=player.get("avatar_image"),
        total_recharge_amount=player.get("total_recharge_amount"),
        hashed_password=hash_password(str(fid)),
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    return member


async def login(fid: int, password: str, db: Session) -> str:
    member = db.query(Member).filter(Member.fid == fid).first()
    if not member or not verify_password(password, member.hashed_password):
        raise AuthException("Invalid FID or password")

    # Update Kingshot metadata on login (login is allowed even if this fails)
    try:
        player = await fetch_player(fid)
        member.nickname = player.get("nickname")
        member.kid = player.get("kid")
        member.stove_lv = player.get("stove_lv")
        member.stove_lv_content = player.get("stove_lv_content")
        member.avatar_image = player.get("avatar_image")
        member.total_recharge_amount = player.get("total_recharge_amount")
        db.commit()
    except KingshotAPIException:
        pass

    db.refresh(member)
    return create_access_token(member.id), member


def change_password(member_id: int, current_password: str, new_password: str, db: Session) -> None:
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise AuthException("User not found")
    if not verify_password(current_password, member.hashed_password):
        raise AuthException("Current password is incorrect")

    member.hashed_password = hash_password(new_password)
    db.commit()
