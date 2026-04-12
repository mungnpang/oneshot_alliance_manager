import base64
import json
from datetime import datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel

from app.models.alliance_member import AllianceRank

T = TypeVar("T")


class CursorPage(BaseModel, Generic[T]):
    items: list[T]
    next_cursor: str | None


def encode_cursor(data: dict) -> str:
    return base64.urlsafe_b64encode(json.dumps(data).encode()).decode()


def decode_cursor(cursor: str) -> dict:
    try:
        return json.loads(base64.urlsafe_b64decode(cursor + "=="))
    except Exception:
        from app.core.exceptions import OneshotException
        raise OneshotException(400, "Invalid cursor")


# ── Member ──────────────────────────────────────────────────────────────────

class MemberRead(BaseModel):
    id: int
    fid: int
    nickname: str | None
    kid: int | None
    avatar_image: str | None
    is_admin: bool
    created_at: datetime
    updated_at: datetime
    alliance_alias: str | None = None

    model_config = {"from_attributes": True}


class MemberCreate(BaseModel):
    fid: int


class MemberUpdate(BaseModel):
    nickname: str | None = None
    kid: int | None = None
    avatar_image: str | None = None
    is_admin: bool | None = None


# ── Alliance ─────────────────────────────────────────────────────────────────

class AllianceCreate(BaseModel):
    name: str
    alias: str
    kid: int
    leader_id: int | None = None
    power: int | None = None
    num_member: int | None = None
    language: str | None = None


class AllianceUpdate(BaseModel):
    name: str | None = None
    alias: str | None = None
    kid: int | None = None
    leader_id: int | None = None
    power: int | None = None
    num_member: int | None = None
    language: str | None = None


class AllianceRead(BaseModel):
    id: int
    name: str
    alias: str
    kid: int
    leader_id: int | None
    power: int | None
    num_member: int | None
    language: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AllianceMemberAdd(BaseModel):
    member_id: int
    joined_date: datetime | None = None
    rank: AllianceRank = AllianceRank.R1


class AllianceMemberUpdate(BaseModel):
    rank: AllianceRank


class AllianceMemberRead(BaseModel):
    id: int
    alliance_id: int
    member_id: int
    rank: AllianceRank
    joined_date: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Event ────────────────────────────────────────────────────────────────────

class EventCreate(BaseModel):
    name: str
    eval_weight: float = 1.0
    description: str | None = None


class EventUpdate(BaseModel):
    name: str | None = None
    eval_weight: float | None = None
    description: str | None = None


class EventRead(BaseModel):
    id: int
    name: str
    eval_weight: float
    description: str | None
    thumbnail_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── EventOccurrence ───────────────────────────────────────────────────

class EventOccurrenceCreate(BaseModel):
    alliance_id: int
    period_start: datetime
    period_end: datetime | None = None
    label: str | None = None
    note: str | None = None


class EventOccurrenceUpdate(BaseModel):
    period_start: datetime | None = None
    period_end: datetime | None = None
    label: str | None = None
    note: str | None = None


class EventOccurrenceRead(BaseModel):
    id: int
    event_id: int
    alliance_id: int | None
    period_start: datetime
    period_end: datetime | None
    label: str | None
    note: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EventOccurrenceWithEventRead(EventOccurrenceRead):
    event_name: str
    event_thumbnail_url: str | None


# ── EventParticipation ───────────────────────────────────────────────────────

class ParticipationCreate(BaseModel):
    occurrence_id: int
    member_id: int
    is_participated: bool = False
    score: int | None = None
    extra_info: dict[str, Any] | None = None


class ParticipationBulkItem(BaseModel):
    member_id: int
    is_participated: bool = False
    score: int | None = None


class ParticipationBulkCreateBody(BaseModel):
    occurrence_id: int
    items: list[ParticipationBulkItem]


class ParticipationBulkCreateResponse(BaseModel):
    created: int
    skipped: int


class ParticipationUpdate(BaseModel):
    is_participated: bool | None = None
    score: int | None = None
    extra_info: dict[str, Any] | None = None


# ── Screenshot OCR ────────────────────────────────────────────────────────────

class ParsedMember(BaseModel):
    raw_nickname: str
    alliance_tag: str | None
    score: int | None
    matched_member_id: int | None
    matched_member_name: str | None
    confidence: float


class ParseScreenshotResponse(BaseModel):
    items: list[ParsedMember]


class BulkRecord(BaseModel):
    member_id: int
    score: int | None = None


class BulkParticipationRequest(BaseModel):
    records: list[BulkRecord]
    upsert: bool = False


class DuplicateRecord(BaseModel):
    member_id: int
    member_name: str
    existing_score: int | None
    new_score: int | None


class BulkParticipationResponse(BaseModel):
    inserted: int
    upserted: int
    duplicates: list[DuplicateRecord]


class ParticipationRead(BaseModel):
    id: int
    event_id: int
    occurrence_id: int
    member_id: int
    is_participated: bool
    score: int | None
    extra_info: dict[str, Any] | None
    period_start: datetime
    period_end: datetime | None
    occurrence_label: str | None = None
    created_at: datetime
    updated_at: datetime


class LeaderboardEntry(BaseModel):
    member_id: int
    nickname: str | None
    event_id: int
    count: int
    avg_score: float | None
