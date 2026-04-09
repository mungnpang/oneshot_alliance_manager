from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.api.v1.endpoints.auth import get_current_admin
from app.core.database import get_db
from app.models.member import Member
from app.schemas.admin import (
    AllianceCreate, AllianceMemberAdd, AllianceMemberRead, AllianceMemberUpdate, AllianceRead, AllianceUpdate,
    BulkParticipationRequest, BulkParticipationResponse, ParseScreenshotResponse,
    CursorPage, EventCreate, EventOccurrenceCreate, EventOccurrenceRead, EventOccurrenceUpdate,
    EventOccurrenceWithEventRead, EventRead, EventUpdate,
    MemberCreate, MemberRead, MemberUpdate,
    ParticipationCreate, ParticipationRead, ParticipationUpdate,
)
from app.services import admin_service, auth_service, screenshot_service

router = APIRouter(prefix="/admin")
_admin = Depends(get_current_admin)


# ── Members ──────────────────────────────────────────────────────────────────

@router.get("/members", response_model=CursorPage[MemberRead])
def list_members(
    cursor: str | None = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: Member = _admin,
):
    return admin_service.list_members(db, cursor=cursor, limit=min(limit, 200))


@router.post("/members", response_model=MemberRead, status_code=201)
async def create_member(body: MemberCreate, db: Session = Depends(get_db), _: Member = _admin):
    member = await auth_service.register(body.fid, db)
    return admin_service.member_as_read(db, member)


@router.get("/members/{member_id}", response_model=MemberRead)
def get_member(member_id: int, db: Session = Depends(get_db), _: Member = _admin):
    m = admin_service.get_member(db, member_id)
    return admin_service.member_as_read(db, m)


@router.put("/members/{member_id}", response_model=MemberRead)
def update_member(member_id: int, body: MemberUpdate, db: Session = Depends(get_db), _: Member = _admin):
    m = admin_service.update_member(db, member_id, body)
    return admin_service.member_as_read(db, m)


@router.delete("/members/{member_id}", status_code=204)
def delete_member(member_id: int, db: Session = Depends(get_db), _: Member = _admin):
    admin_service.delete_member(db, member_id)


# ── Alliances ─────────────────────────────────────────────────────────────────

@router.get("/alliances", response_model=list[AllianceRead])
def list_alliances(db: Session = Depends(get_db), _: Member = _admin):
    return admin_service.list_alliances(db)


@router.post("/alliances", response_model=AllianceRead, status_code=201)
def create_alliance(body: AllianceCreate, db: Session = Depends(get_db), _: Member = _admin):
    return admin_service.create_alliance(db, body)


@router.get("/alliances/{alliance_id}", response_model=AllianceRead)
def get_alliance(alliance_id: int, db: Session = Depends(get_db), _: Member = _admin):
    return admin_service.get_alliance(db, alliance_id)


@router.put("/alliances/{alliance_id}", response_model=AllianceRead)
def update_alliance(alliance_id: int, body: AllianceUpdate, db: Session = Depends(get_db), _: Member = _admin):
    return admin_service.update_alliance(db, alliance_id, body)


@router.delete("/alliances/{alliance_id}", status_code=204)
def delete_alliance(alliance_id: int, db: Session = Depends(get_db), _: Member = _admin):
    admin_service.delete_alliance(db, alliance_id)


@router.get("/alliances/{alliance_id}/members", response_model=CursorPage[AllianceMemberRead])
def list_alliance_members(
    alliance_id: int,
    cursor: str | None = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: Member = _admin,
):
    return admin_service.list_alliance_members(db, alliance_id, cursor=cursor, limit=min(limit, 200))


@router.post("/alliances/{alliance_id}/members", response_model=AllianceMemberRead, status_code=201)
def add_alliance_member(alliance_id: int, body: AllianceMemberAdd, db: Session = Depends(get_db), _: Member = _admin):
    return admin_service.add_alliance_member(db, alliance_id, body)


@router.put("/alliances/{alliance_id}/members/{member_id}", response_model=AllianceMemberRead)
def update_alliance_member(
    alliance_id: int,
    member_id: int,
    body: AllianceMemberUpdate,
    db: Session = Depends(get_db),
    _: Member = _admin,
):
    return admin_service.update_alliance_member(db, alliance_id, member_id, body)


@router.delete("/alliances/{alliance_id}/members/{member_id}", status_code=204)
def remove_alliance_member(alliance_id: int, member_id: int, db: Session = Depends(get_db), _: Member = _admin):
    admin_service.remove_alliance_member(db, alliance_id, member_id)


# ── Events ────────────────────────────────────────────────────────────────────

@router.get("/events", response_model=list[EventRead])
def list_events(db: Session = Depends(get_db), _: Member = _admin):
    return admin_service.list_events(db)


@router.post("/events", response_model=EventRead, status_code=201)
def create_event(body: EventCreate, db: Session = Depends(get_db), _: Member = _admin):
    return admin_service.create_event(db, body)


@router.get("/events/{event_id}", response_model=EventRead)
def get_event(event_id: int, db: Session = Depends(get_db), _: Member = _admin):
    return admin_service.get_event(db, event_id)


@router.put("/events/{event_id}", response_model=EventRead)
def update_event(event_id: int, body: EventUpdate, db: Session = Depends(get_db), _: Member = _admin):
    return admin_service.update_event(db, event_id, body)


@router.delete("/events/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db), _: Member = _admin):
    admin_service.delete_event(db, event_id)


# ── Event occurrences ─────────────────────────────────────────────────

@router.get("/occurrences", response_model=list[EventOccurrenceWithEventRead])
def list_all_occurrences_by_month(
    year: int,
    month: int,
    db: Session = Depends(get_db),
    _: Member = _admin,
):
    return admin_service.list_occurrences_by_month(db, year, month)


@router.get("/events/{event_id}/occurrences", response_model=CursorPage[EventOccurrenceRead])
def list_occurrences(
    event_id: int,
    alliance_id: int | None = None,
    cursor: str | None = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: Member = _admin,
):
    return admin_service.list_occurrences(db, event_id, alliance_id=alliance_id, cursor=cursor, limit=min(limit, 200))


@router.post("/events/{event_id}/occurrences", response_model=EventOccurrenceRead, status_code=201)
def create_occurrence(
    event_id: int,
    body: EventOccurrenceCreate,
    db: Session = Depends(get_db),
    _: Member = _admin,
):
    return admin_service.create_occurrence(db, event_id, body)


@router.get("/occurrences/{occurrence_id}", response_model=EventOccurrenceRead)
def get_occurrence(occurrence_id: int, db: Session = Depends(get_db), _: Member = _admin):
    return admin_service.get_occurrence(db, occurrence_id)


@router.put("/occurrences/{occurrence_id}", response_model=EventOccurrenceRead)
def update_occurrence(
    occurrence_id: int,
    body: EventOccurrenceUpdate,
    db: Session = Depends(get_db),
    _: Member = _admin,
):
    return admin_service.update_occurrence(db, occurrence_id, body)


@router.delete("/occurrences/{occurrence_id}", status_code=204)
def delete_occurrence(occurrence_id: int, db: Session = Depends(get_db), _: Member = _admin):
    admin_service.delete_occurrence(db, occurrence_id)


# ── Event Participations ──────────────────────────────────────────────────────

@router.get("/events/{event_id}/participations", response_model=list[ParticipationRead])
def list_participations(event_id: int, db: Session = Depends(get_db), _: Member = _admin):
    return admin_service.list_participations(db, event_id)


@router.post("/events/{event_id}/participations", response_model=ParticipationRead, status_code=201)
def create_participation(event_id: int, body: ParticipationCreate, db: Session = Depends(get_db), _: Member = _admin):
    return admin_service.create_participation(db, event_id, body)


@router.put("/participations/{participation_id}", response_model=ParticipationRead)
def update_participation(participation_id: int, body: ParticipationUpdate, db: Session = Depends(get_db), _: Member = _admin):
    return admin_service.update_participation(db, participation_id, body)


@router.delete("/participations/{participation_id}", status_code=204)
def delete_participation(participation_id: int, db: Session = Depends(get_db), _: Member = _admin):
    admin_service.delete_participation(db, participation_id)


# ── Screenshot OCR ────────────────────────────────────────────────────────────

@router.post("/occurrences/{occurrence_id}/parse-screenshots", response_model=ParseScreenshotResponse)
async def parse_screenshots(
    occurrence_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    _: Member = _admin,
):
    image_bytes_list = []
    for f in files:
        data = await f.read()
        mime_type = f.content_type or "image/jpeg"
        image_bytes_list.append((mime_type, data))

    items = await screenshot_service.parse_screenshots(db, occurrence_id, image_bytes_list)
    return ParseScreenshotResponse(items=items)


@router.post("/occurrences/{occurrence_id}/bulk-participations", response_model=BulkParticipationResponse)
def bulk_participations(
    occurrence_id: int,
    body: BulkParticipationRequest,
    db: Session = Depends(get_db),
    _: Member = _admin,
):
    result = screenshot_service.bulk_create_participations(
        db,
        occurrence_id,
        [r.model_dump() for r in body.records],
        upsert=body.upsert,
    )
    return BulkParticipationResponse(**result)
