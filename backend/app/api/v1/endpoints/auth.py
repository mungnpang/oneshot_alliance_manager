from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import AuthException
from app.core.security import create_access_token, decode_access_token
from app.models.alliance_member import AllianceMember
from app.models.member import Member
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    TokenResponse,
    UserData,
)
from app.services import auth_service

router = APIRouter(prefix="/auth")
_bearer = HTTPBearer()


def _get_current_member_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> int:
    try:
        return decode_access_token(credentials.credentials)
    except JWTError:
        raise AuthException("Invalid token")


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> Member:
    try:
        member_id = decode_access_token(credentials.credentials)
    except JWTError:
        raise AuthException("Invalid token")
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member or not member.is_admin:
        raise AuthException("Admin privileges required")
    return member


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: Session = Depends(get_db)):
    member = await auth_service.register(body.fid, db)
    return TokenResponse(access_token=create_access_token(member.id))


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, db: Session = Depends(get_db)):
    token, member = await auth_service.login(body.fid, body.password, db)
    am = db.query(AllianceMember).filter(AllianceMember.member_id == member.id).first()
    alliance_alias = am.alliance.alias if am else None
    user = UserData.model_validate(member)
    user.alliance_alias = alliance_alias
    return LoginResponse(access_token=token, user=user)


@router.post("/change-password", status_code=204)
def change_password(
    body: ChangePasswordRequest,
    member_id: int = Depends(_get_current_member_id),
    db: Session = Depends(get_db),
):
    auth_service.change_password(member_id, body.current_password, body.new_password, db)
