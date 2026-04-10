from datetime import datetime, timezone
import calendar

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import OneshotException
from app.models.alliance import Alliance
from app.models.alliance_member import AllianceMember
from app.models.event import Event
from app.models.event_occurrence import EventOccurrence
from app.models.event_participation import EventParticipation
from app.models.member import Member
from app.schemas.admin import (
    AllianceCreate, AllianceMemberAdd, AllianceMemberUpdate, AllianceUpdate,
    CursorPage, EventCreate, EventOccurrenceCreate, EventOccurrenceUpdate, EventUpdate,
    MemberRead, MemberUpdate,
    ParticipationCreate, ParticipationRead, ParticipationUpdate,
    decode_cursor, encode_cursor,
)


def _not_found(label: str, id: int):
    raise OneshotException(404, f"{label} {id} not found")


# ── Members ──────────────────────────────────────────────────────────────────

def member_as_read(db: Session, m: Member) -> MemberRead:
    row = (
        db.query(Alliance.alias)
        .join(AllianceMember, AllianceMember.alliance_id == Alliance.id)
        .filter(AllianceMember.member_id == m.id)
        .first()
    )
    alias = row[0] if row else None
    return MemberRead(
        id=m.id,
        fid=m.fid,
        nickname=m.nickname,
        kid=m.kid,
        stove_lv=m.stove_lv,
        stove_lv_content=m.stove_lv_content,
        avatar_image=m.avatar_image,
        is_admin=m.is_admin,
        created_at=m.created_at,
        updated_at=m.updated_at,
        alliance_alias=alias,
    )


def list_members(db: Session, cursor: str | None = None, limit: int = 50) -> CursorPage[MemberRead]:
    query = (
        db.query(Member, Alliance.alias)
        .outerjoin(AllianceMember, AllianceMember.member_id == Member.id)
        .outerjoin(Alliance, Alliance.id == AllianceMember.alliance_id)
        .order_by(Member.id)
    )
    if cursor:
        data = decode_cursor(cursor)
        query = query.filter(Member.id > data["id"])
    rows = query.limit(limit + 1).all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    items = [
        MemberRead(
            id=m.id,
            fid=m.fid,
            nickname=m.nickname,
            kid=m.kid,
            stove_lv=m.stove_lv,
            stove_lv_content=m.stove_lv_content,
            avatar_image=m.avatar_image,
            is_admin=m.is_admin,
            created_at=m.created_at,
            updated_at=m.updated_at,
            alliance_alias=alias,
        )
        for m, alias in rows
    ]
    next_cursor = encode_cursor({"id": rows[-1][0].id}) if has_more else None
    return CursorPage(items=items, next_cursor=next_cursor)


def get_member(db: Session, member_id: int) -> Member:
    m = db.query(Member).filter(Member.id == member_id).first()
    if not m:
        _not_found("Member", member_id)
    return m


def update_member(db: Session, member_id: int, data: MemberUpdate) -> Member:
    m = get_member(db, member_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(m, field, value)
    db.commit()
    db.refresh(m)
    return m


def delete_member(db: Session, member_id: int) -> None:
    m = get_member(db, member_id)
    db.delete(m)
    db.commit()


# ── Alliances ─────────────────────────────────────────────────────────────────

def list_alliances(db: Session) -> list[Alliance]:
    return db.query(Alliance).order_by(Alliance.id).all()


def get_alliance(db: Session, alliance_id: int) -> Alliance:
    a = db.query(Alliance).filter(Alliance.id == alliance_id).first()
    if not a:
        _not_found("Alliance", alliance_id)
    return a


def create_alliance(db: Session, data: AllianceCreate) -> Alliance:
    a = Alliance(**data.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


def update_alliance(db: Session, alliance_id: int, data: AllianceUpdate) -> Alliance:
    a = get_alliance(db, alliance_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(a, field, value)
    db.commit()
    db.refresh(a)
    return a


def delete_alliance(db: Session, alliance_id: int) -> None:
    a = get_alliance(db, alliance_id)
    db.delete(a)
    db.commit()


def list_alliance_members(
    db: Session, alliance_id: int, cursor: str | None = None, limit: int = 50
) -> CursorPage:
    query = (
        db.query(AllianceMember)
        .filter(AllianceMember.alliance_id == alliance_id)
        .order_by(AllianceMember.id)
    )
    if cursor:
        data = decode_cursor(cursor)
        query = query.filter(AllianceMember.id > data["id"])
    rows = query.limit(limit + 1).all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = encode_cursor({"id": rows[-1].id}) if has_more else None
    return CursorPage(items=rows, next_cursor=next_cursor)


def add_alliance_member(db: Session, alliance_id: int, data: AllianceMemberAdd) -> AllianceMember:
    get_alliance(db, alliance_id)
    # If already in another alliance, replace existing record
    existing = db.query(AllianceMember).filter(AllianceMember.member_id == data.member_id).first()
    if existing:
        existing.alliance_id = alliance_id
        existing.joined_date = data.joined_date
        existing.rank = data.rank
        db.commit()
        db.refresh(existing)
        return existing
    am = AllianceMember(
        alliance_id=alliance_id,
        member_id=data.member_id,
        joined_date=data.joined_date,
        rank=data.rank,
    )
    db.add(am)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise OneshotException(409, "Member already belongs to another alliance")
    db.refresh(am)
    return am


def update_alliance_member(
    db: Session, alliance_id: int, member_id: int, data: AllianceMemberUpdate
) -> AllianceMember:
    am = (
        db.query(AllianceMember)
        .filter(AllianceMember.alliance_id == alliance_id, AllianceMember.member_id == member_id)
        .first()
    )
    if not am:
        raise OneshotException(404, "Alliance member not found")
    am.rank = data.rank
    db.commit()
    db.refresh(am)
    return am


def remove_alliance_member(db: Session, alliance_id: int, member_id: int) -> None:
    am = (
        db.query(AllianceMember)
        .filter(AllianceMember.alliance_id == alliance_id, AllianceMember.member_id == member_id)
        .first()
    )
    if not am:
        raise OneshotException(404, "Alliance member not found")
    db.delete(am)
    db.commit()


# ── Events ───────────────────────────────────────────────────────────────────

def list_events(db: Session) -> list[Event]:
    return db.query(Event).order_by(Event.id).all()


def get_event(db: Session, event_id: int) -> Event:
    e = db.query(Event).filter(Event.id == event_id).first()
    if not e:
        _not_found("Event", event_id)
    return e


def create_event(db: Session, data: EventCreate) -> Event:
    e = Event(**data.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


def update_event(db: Session, event_id: int, data: EventUpdate) -> Event:
    e = get_event(db, event_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(e, field, value)
    db.commit()
    db.refresh(e)
    return e


def delete_event(db: Session, event_id: int) -> None:
    e = get_event(db, event_id)
    db.delete(e)
    db.commit()


# ── EventOccurrences ─────────────────────────────────────────────────────────

def list_occurrences(
    db: Session, event_id: int, alliance_id: int | None = None, cursor: str | None = None, limit: int = 50
) -> CursorPage:
    query = (
        db.query(EventOccurrence)
        .filter(EventOccurrence.event_id == event_id)
        .order_by(EventOccurrence.period_start.desc(), EventOccurrence.id.desc())
    )
    if alliance_id is not None:
        query = query.filter(EventOccurrence.alliance_id == alliance_id)
    if cursor:
        data = decode_cursor(cursor)
        ts = data["ts"]
        oid = data["id"]
        query = query.filter(
            (EventOccurrence.period_start < ts)
            | ((EventOccurrence.period_start == ts) & (EventOccurrence.id < oid))
        )
    rows = query.limit(limit + 1).all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = (
        encode_cursor({"ts": rows[-1].period_start.isoformat(), "id": rows[-1].id})
        if has_more else None
    )
    return CursorPage(items=rows, next_cursor=next_cursor)


def list_occurrences_by_month(db: Session, year: int, month: int) -> list:
    last_day = calendar.monthrange(year, month)[1]
    start = datetime(year, month, 1, tzinfo=timezone.utc)
    end = datetime(year, month, last_day, 23, 59, 59, tzinfo=timezone.utc)
    rows = (
        db.query(EventOccurrence)
        .options(joinedload(EventOccurrence.event))
        .filter(EventOccurrence.period_start >= start)
        .filter(EventOccurrence.period_start <= end)
        .order_by(EventOccurrence.period_start)
        .all()
    )
    result = []
    for occ in rows:
        result.append({
            "id": occ.id,
            "event_id": occ.event_id,
            "alliance_id": occ.alliance_id,
            "period_start": occ.period_start,
            "period_end": occ.period_end,
            "label": occ.label,
            "note": occ.note,
            "created_at": occ.created_at,
            "updated_at": occ.updated_at,
            "event_name": occ.event.name if occ.event else "",
            "event_thumbnail_url": occ.event.thumbnail_url if occ.event else None,
        })
    return result


def create_occurrence(db: Session, event_id: int, data: EventOccurrenceCreate) -> EventOccurrence:
    get_event(db, event_id)
    eo = EventOccurrence(event_id=event_id, **data.model_dump())
    db.add(eo)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise OneshotException(409, "An occurrence with the same start time already exists")
    db.refresh(eo)
    return eo


def get_occurrence(db: Session, occurrence_id: int) -> EventOccurrence:
    eo = db.query(EventOccurrence).filter(EventOccurrence.id == occurrence_id).first()
    if not eo:
        _not_found("Event occurrence", occurrence_id)
    return eo


def update_occurrence(db: Session, occurrence_id: int, data: EventOccurrenceUpdate) -> EventOccurrence:
    eo = get_occurrence(db, occurrence_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(eo, field, value)
    db.commit()
    db.refresh(eo)
    return eo


def delete_occurrence(db: Session, occurrence_id: int) -> None:
    eo = get_occurrence(db, occurrence_id)
    db.delete(eo)
    db.commit()


# ── EventParticipations ───────────────────────────────────────────────────────

def participation_to_read(ep: EventParticipation) -> ParticipationRead:
    occ = ep.occurrence
    if occ is None:
        raise OneshotException(500, "Participation record has no occurrence information")
    return ParticipationRead(
        id=ep.id,
        event_id=ep.event_id,
        occurrence_id=ep.occurrence_id,
        member_id=ep.member_id,
        is_participated=ep.is_participated,
        score=ep.score,
        extra_info=ep.extra_info,
        period_start=occ.period_start,
        period_end=occ.period_end,
        occurrence_label=occ.label,
        created_at=ep.created_at,
        updated_at=ep.updated_at,
    )


def list_participations(db: Session, event_id: int, occurrence_id: int | None = None) -> list[ParticipationRead]:
    query = (
        db.query(EventParticipation)
        .options(joinedload(EventParticipation.occurrence))
        .filter(EventParticipation.event_id == event_id)
    )
    if occurrence_id is not None:
        query = query.filter(EventParticipation.occurrence_id == occurrence_id)
    rows = query.order_by(EventParticipation.id).all()
    return [participation_to_read(p) for p in rows]


def create_participation(db: Session, event_id: int, data: ParticipationCreate) -> ParticipationRead:
    get_event(db, event_id)
    occ = db.query(EventOccurrence).filter(EventOccurrence.id == data.occurrence_id).first()
    if not occ or occ.event_id != event_id:
        raise OneshotException(400, "Invalid event occurrence")
    ep = EventParticipation(
        event_id=event_id,
        occurrence_id=data.occurrence_id,
        member_id=data.member_id,
        is_participated=data.is_participated,
        score=data.score,
        extra_info=data.extra_info,
    )
    db.add(ep)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise OneshotException(409, "A record with the same event/member/start date already exists")
    db.refresh(ep)
    loaded = (
        db.query(EventParticipation)
        .options(joinedload(EventParticipation.occurrence))
        .filter(EventParticipation.id == ep.id)
        .first()
    )
    if not loaded:
        raise OneshotException(500, "Failed to load participation record")
    return participation_to_read(loaded)


def get_participation(db: Session, participation_id: int) -> EventParticipation:
    ep = db.query(EventParticipation).filter(EventParticipation.id == participation_id).first()
    if not ep:
        _not_found("Participation record", participation_id)
    return ep


def update_participation(db: Session, participation_id: int, data: ParticipationUpdate) -> ParticipationRead:
    ep = get_participation(db, participation_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(ep, field, value)
    db.commit()
    loaded = (
        db.query(EventParticipation)
        .options(joinedload(EventParticipation.occurrence))
        .filter(EventParticipation.id == ep.id)
        .first()
    )
    if not loaded:
        raise OneshotException(500, "Failed to load participation record")
    return participation_to_read(loaded)


def delete_participation(db: Session, participation_id: int) -> None:
    ep = get_participation(db, participation_id)
    db.delete(ep)
    db.commit()
