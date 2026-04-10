from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import AuthException
from app.core.security import decode_access_token
from app.models.event import Event
from app.models.event_participation import EventParticipation
from app.schemas.admin import EventOccurrenceWithEventRead
from app.services import admin_service

router = APIRouter(prefix="/public")
_bearer = HTTPBearer()


def _get_member_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> int:
    try:
        return decode_access_token(credentials.credentials)
    except JWTError:
        raise AuthException("Invalid token")


# ── Schemas ───────────────────────────────────────────────────────────────────

class EventStatItem(BaseModel):
    event_id: int
    event_name: str
    thumbnail_url: str | None
    count: int
    eval_weight: float

class MemberStatsResponse(BaseModel):
    stats: list[EventStatItem]
    total_score: float


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/occurrences", response_model=list[EventOccurrenceWithEventRead])
def list_occurrences_by_month(year: int, month: int, db: Session = Depends(get_db)):
    return admin_service.list_occurrences_by_month(db, year, month)


@router.get("/me/stats", response_model=MemberStatsResponse)
def get_my_stats(
    member_id: int = Depends(_get_member_id),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            Event.id,
            Event.name,
            Event.thumbnail_url,
            Event.eval_weight,
            func.count(EventParticipation.id).label("count"),
        )
        .join(EventParticipation, EventParticipation.event_id == Event.id)
        .filter(
            EventParticipation.member_id == member_id,
            EventParticipation.is_participated == True,
        )
        .group_by(Event.id, Event.name, Event.thumbnail_url, Event.eval_weight)
        .order_by(func.count(EventParticipation.id).desc())
        .all()
    )

    stats = [
        EventStatItem(
            event_id=r.id,
            event_name=r.name,
            thumbnail_url=r.thumbnail_url,
            count=r.count,
            eval_weight=r.eval_weight,
        )
        for r in rows
    ]
    total_score = sum(s.eval_weight * s.count for s in stats)

    return MemberStatsResponse(stats=stats, total_score=total_score)
