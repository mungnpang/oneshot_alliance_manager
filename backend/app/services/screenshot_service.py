"""Screenshot OCR service using Gemini Flash Vision API."""
import asyncio
import json
import re
from functools import partial
from typing import Optional

from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from rapidfuzz import fuzz, process
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.exceptions import OneshotException
from app.models.alliance_member import AllianceMember
from app.models.event_occurrence import EventOccurrence
from app.models.member import Member


_GEMINI_PROMPT = """\
이 이미지들은 모바일 게임 이벤트 결과 랭킹 화면이야.
각 플레이어 행에서 다음 정보를 추출해줘:
- alliance_tag: 닉네임 앞에 [TAG] 또는 [TAG] 형식으로 있으면 TAG 문자열만, 없으면 null
- nickname: 태그를 제외한 순수 닉네임 (공백 포함 가능)
- score: 점수 숫자 (쉼표 제거한 정수), 없으면 null

여러 이미지에 동일한 닉네임이 있으면 score가 가장 높은 것 하나만 포함해줘.
배경 텍스트, 제목, 탭 이름, 안내문 등 플레이어 행이 아닌 텍스트는 제외해줘.

반드시 JSON 배열만 응답해줘 (마크다운 코드블록 없이):
[{"alliance_tag": "ONE", "nickname": "lxl Python lxl", "score": 3189480421}, ...]
"""


def _get_client() -> genai.Client:
    if not settings.gemini_api_key:
        raise OneshotException(500, "GEMINI_API_KEY not configured")
    return genai.Client(api_key=settings.gemini_api_key)


def _parse_gemini_response(text: str) -> list[dict]:
    """Extract JSON array from Gemini response text."""
    text = text.strip()
    # Strip markdown code blocks if present
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    try:
        data = json.loads(text)
        if not isinstance(data, list):
            return []
        return data
    except json.JSONDecodeError:
        return []


def _deduplicate(items: list[dict]) -> list[dict]:
    """Keep highest score per nickname (case-insensitive)."""
    seen: dict[str, dict] = {}
    for item in items:
        key = item.get("nickname", "").strip().lower()
        if not key:
            continue
        existing = seen.get(key)
        score = item.get("score") or 0
        if existing is None or score > (existing.get("score") or 0):
            seen[key] = item
    return list(seen.values())


def _load_alliance_member_candidates(db: Session, alliance_id: int) -> list[tuple[int, str]]:
    rows = (
        db.query(Member.id, Member.nickname)
        .join(AllianceMember, AllianceMember.member_id == Member.id)
        .filter(AllianceMember.alliance_id == alliance_id)
        .filter(Member.nickname.isnot(None))
        .all()
    )
    return [(r[0], r[1]) for r in rows]


def _load_all_member_candidates(db: Session) -> list[tuple[int, str]]:
    rows = (
        db.query(Member.id, Member.nickname)
        .filter(Member.nickname.isnot(None))
        .all()
    )
    return [(r[0], r[1]) for r in rows]


def _fuzzy_match(
    raw_nickname: str,
    candidates: list[tuple[int, str]],
    threshold: int = 60,
) -> tuple[Optional[int], Optional[str], float]:
    """Returns (member_id, member_name, confidence). member_id=None if no match."""
    if not candidates:
        return None, None, 0.0

    names = [c[1] for c in candidates]
    result = process.extractOne(raw_nickname, names, scorer=fuzz.WRatio)
    if result and result[1] >= threshold:
        idx = names.index(result[0])
        member_id, member_name = candidates[idx]
        return member_id, member_name, float(result[1])
    return None, None, 0.0


async def parse_screenshots(
    db: Session,
    occurrence_id: int,
    image_bytes_list: list[tuple[str, bytes]],  # [(mime_type, bytes), ...]
) -> list[dict]:
    """
    Parse multiple screenshot images and return matched member data.

    Returns list of:
    {
        raw_nickname, alliance_tag, score,
        matched_member_id, matched_member_name, confidence
    }
    """
    occurrence = (
        db.query(EventOccurrence)
        .options(joinedload(EventOccurrence.alliance))
        .filter(EventOccurrence.id == occurrence_id)
        .first()
    )
    if not occurrence:
        raise OneshotException(404, f"Occurrence {occurrence_id} not found")

    occurrence_alias: Optional[str] = None
    if occurrence.alliance_id and occurrence.alliance:
        occurrence_alias = occurrence.alliance.alias

    alliance_candidates: Optional[list[tuple[int, str]]] = None
    all_members_candidates: Optional[list[tuple[int, str]]] = None

    # Call Gemini Vision
    client = _get_client()
    parts: list[types.Part] = [types.Part(text=_GEMINI_PROMPT)]
    for mime_type, data in image_bytes_list:
        parts.append(types.Part(inline_data=types.Blob(mime_type=mime_type, data=data)))

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            partial(client.models.generate_content, model="gemini-2.5-flash", contents=parts),
        )
    except genai_errors.ClientError as e:
        status = getattr(e, "status_code", 0)
        if status == 429:
            raise OneshotException(429, "Gemini API 호출 한도 초과 (429). Google AI Studio에서 quota를 확인하세요.")
        raise OneshotException(502, f"Gemini API 호출 실패 ({status or 'unknown'}). 잠시 후 다시 시도해주세요.")
    except Exception as e:
        raise OneshotException(502, f"이미지 분석 중 오류가 발생했습니다: {type(e).__name__}")
    raw_items = _parse_gemini_response(response.text)
    deduped = _deduplicate(raw_items)

    # Fuzzy match each item
    result = []
    for item in deduped:
        raw_nickname = (item.get("nickname") or "").strip()
        alliance_tag = (item.get("alliance_tag") or "").strip() or None
        score = item.get("score")
        if isinstance(score, str):
            score = int(re.sub(r"[,\s]", "", score)) if score else None

        has_matching_tag = (
            alliance_tag
            and occurrence_alias
            and alliance_tag.upper() == occurrence_alias.upper()
        )
        if has_matching_tag and occurrence.alliance_id:
            if alliance_candidates is None:
                alliance_candidates = _load_alliance_member_candidates(db, occurrence.alliance_id)
            candidates = alliance_candidates
        else:
            if all_members_candidates is None:
                all_members_candidates = _load_all_member_candidates(db)
            candidates = all_members_candidates
        matched_id, matched_name, confidence = _fuzzy_match(raw_nickname, candidates)

        result.append({
            "raw_nickname": raw_nickname,
            "alliance_tag": alliance_tag,
            "score": score,
            "matched_member_id": matched_id,
            "matched_member_name": matched_name,
            "confidence": confidence,
        })

    return result


def bulk_create_participations(
    db: Session,
    occurrence_id: int,
    records: list[dict],  # [{member_id, score}]
    upsert: bool,
) -> dict:
    """
    Insert or upsert participation records.

    If upsert=False: inserts only new records, returns duplicates for user confirmation.
    If upsert=True: upserts all records (updates score if exists).

    Returns: {inserted, upserted, duplicates: [{member_id, member_name, existing_score, new_score}]}
    """
    from app.models.event_participation import EventParticipation

    occurrence = db.query(EventOccurrence).filter(EventOccurrence.id == occurrence_id).first()
    if not occurrence:
        raise OneshotException(404, f"Occurrence {occurrence_id} not found")

    by_member: dict[int, EventParticipation] = {
        ep.member_id: ep
        for ep in db.query(EventParticipation)
        .filter(EventParticipation.occurrence_id == occurrence_id)
        .all()
    }

    dupe_ids: list[int] = []
    if not upsert:
        for rec in records:
            mid = rec["member_id"]
            if mid in by_member:
                dupe_ids.append(mid)
    members_by_id: dict[int, Member] = {}
    if dupe_ids:
        for m in db.query(Member).filter(Member.id.in_(set(dupe_ids))).all():
            members_by_id[m.id] = m

    inserted = 0
    upserted = 0
    duplicates = []

    for rec in records:
        member_id = rec["member_id"]
        score = rec.get("score")

        existing = by_member.get(member_id)

        if existing:
            if upsert:
                existing.score = score
                existing.is_participated = True
                upserted += 1
            else:
                member = members_by_id.get(member_id)
                duplicates.append({
                    "member_id": member_id,
                    "member_name": member.nickname if member else str(member_id),
                    "existing_score": existing.score,
                    "new_score": score,
                })
        else:
            ep = EventParticipation(
                event_id=occurrence.event_id,
                occurrence_id=occurrence_id,
                member_id=member_id,
                is_participated=True,
                score=score,
            )
            db.add(ep)
            by_member[member_id] = ep
            inserted += 1

    db.commit()
    return {"inserted": inserted, "upserted": upserted, "duplicates": duplicates}
