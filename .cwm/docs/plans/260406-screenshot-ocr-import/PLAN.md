# 스크린샷 OCR 참여 기록 일괄 입력 — 상세 계획서

> **상태**: draft  
> **작성일**: 2026-04-06  
> **.status**: complete

---

## 1. 개요

게임 이벤트 결과 스크린샷(여러 장)을 업로드하면 Gemini Flash Vision API가 멤버 닉네임·점수를 추출하고, 퍼지 매칭으로 DB 멤버에 연결한 뒤, 관리자가 확인 후 일괄로 participation record를 생성하는 기능.

---

## 2. 기술 스택

| 역할 | 선택 |
|------|------|
| Vision OCR | Google Gemini Flash (`gemini-2.0-flash`) |
| 퍼지 매칭 | `rapidfuzz` (Python) |
| 파일 업로드 | FastAPI `UploadFile` (multipart/form-data) |
| 프론트 파일 선택 | HTML `<input type="file" multiple accept="image/*">` |

---

## 3. 데이터 흐름

```
[여러 장 업로드]
      ↓
[Gemini Vision API]
  → 각 이미지에서 {alliance_tag?, nickname, score} 목록 추출
  → 이미지 간 중복 제거 (nickname 기준, score 높은 것 우선)
      ↓
[백엔드 매칭 로직]
  → occurrence.alliance_id → Alliance.alias (예: "ONE") 조회
  → alliance_tag가 있는 row: 해당 alliance 멤버 풀에서만 퍼지 매칭
  → alliance_tag가 없는 row: 전체 멤버에서 퍼지 매칭
  → 매칭 결과: matched_member_id, matched_member_name, confidence
      ↓
[프론트 결과 모달]
  → 전체 row 테이블 표시 (포함/제외 체크박스, 행 삭제 버튼)
  → 매칭 실패 row 하이라이트 + 드롭다운으로 수동 선택
  → Confirm 클릭
      ↓
[중복 검사]
  → 이미 해당 occurrence에 같은 member_id 레코드 존재?
  → 중복 있으면 → 중복 전용 모달 표시
      ├─ Confirm → upsert (score 덮어쓰기)
      └─ Abort → 중복 건너뛰고 신규만 insert
```

---

## 4. API 설계

### 4-1. 스크린샷 파싱
```
POST /api/v1/admin/occurrences/{occurrence_id}/parse-screenshots
Content-Type: multipart/form-data
Body: files=[image1, image2, ...]

Response 200:
{
  "items": [
    {
      "raw_nickname": "lxl Python lxl",
      "alliance_tag": "ONE",          // null if not found in screenshot
      "score": 3189480421,
      "matched_member_id": 42,        // null if no match
      "matched_member_name": "Python",
      "confidence": 87.5              // rapidfuzz score (0~100)
    },
    ...
  ]
}
```

### 4-2. 일괄 생성 (신규 + 중복 확인)
```
POST /api/v1/admin/occurrences/{occurrence_id}/bulk-participations
Body: { "records": [{member_id, score}], "upsert": false }

Response 200:
{
  "inserted": 8,
  "duplicates": [
    { "member_id": 42, "member_name": "Python", "existing_score": 3000000000, "new_score": 3189480421 }
  ]
}
```

### 4-3. upsert 확정
```
POST /api/v1/admin/occurrences/{occurrence_id}/bulk-participations
Body: { "records": [{member_id, score}], "upsert": true }

Response 200:
{ "upserted": 2 }
```

---

## 5. 프론트엔드 UX 흐름

```
Occurrence 상세 페이지
  └─ "Upload Screenshot" 버튼 (기존 Add Record 버튼 옆)
        ↓
  [Step 1 모달] 파일 업로드
    - drag-drop or file picker (multiple, image/*)
    - 업로드된 파일 썸네일 목록
    - "Analyze" 버튼 → 로딩 스피너
        ↓
  [Step 2 모달] 파싱 결과 확인 (큰 모달)
    - 컬럼: Raw Name | Matched Member (dropdown) | Score | ✓ (체크박스) | 🗑 (삭제)
    - 매칭 실패 row: 배경 amber, 드롭다운 placeholder "멤버 선택..."
    - 매칭 성공 row: 드롭다운에 매칭된 멤버 pre-select
    - "Confirm" 버튼
        ↓ (중복 없으면 바로 완료)
  [Step 3 모달] 중복 경고 (해당되면)
    - "X건의 레코드가 이미 존재합니다" 안내
    - 중복 목록: 멤버명 | 기존 score | 새 score
    - [Confirm & Upsert] / [Skip Duplicates] 버튼
```

---

## 6. Gemini 프롬프트 전략

```
system: 너는 모바일 게임 랭킹 스크린샷에서 데이터를 추출하는 AI야.
user: 
  이미지들은 게임 이벤트 결과 랭킹 화면이야.
  각 행에서 다음을 추출해줘:
  - alliance_tag: 닉네임 앞에 [TAG] 형식으로 있으면 추출, 없으면 null
  - nickname: 태그를 제외한 순수 닉네임
  - score: 점수 (숫자, 쉼표 제거)
  
  여러 이미지에 같은 닉네임이 있으면 score가 높은 것 하나만 남겨줘.
  
  JSON 배열로만 응답해줘:
  [{"alliance_tag": "ONE", "nickname": "lxl Python lxl", "score": 3189480421}, ...]
```

---

## 7. 퍼지 매칭 로직

```python
from rapidfuzz import process, fuzz

def match_nickname(raw: str, candidates: list[tuple[int, str]], threshold=60):
    # candidates: [(member_id, nickname), ...]
    names = [c[1] for c in candidates]
    result = process.extractOne(raw, names, scorer=fuzz.WRatio)
    if result and result[1] >= threshold:
        idx = names.index(result[0])
        return candidates[idx][0], result[1]  # (member_id, confidence)
    return None, 0
```

alliance_tag 있는 경우 → occurrence.alliance의 멤버만 candidates로
alliance_tag 없는 경우 → 전체 멤버 candidates로

---

## 8. 파일 수정 목록

### Backend
- `pyproject.toml` — `google-generativeai`, `rapidfuzz` 추가
- `app/services/screenshot_service.py` — Gemini 호출, 파싱, 퍼지 매칭 로직 (신규)
- `app/schemas/admin.py` — ParseScreenshotResponse, BulkParticipationRequest/Response 스키마 추가
- `app/api/v1/endpoints/admin.py` — 2개 엔드포인트 추가

### Frontend
- `src/app/admin/events/[id]/participations/page.tsx` — Upload 버튼 + 3단계 모달 추가
- `src/lib/admin-api.ts` — parseScreenshots(), bulkCreateParticipations() 추가

---

## 9. 구현 순서 (Phase)

| Phase | 내용 |
|-------|------|
| **Phase 1** | 백엔드: 패키지 설치 + screenshot_service.py + 스키마 + 엔드포인트 |
| **Phase 2** | 프론트: Upload 버튼 + Step 1 모달 (파일 선택·업로드) |
| **Phase 3** | 프론트: Step 2 모달 (파싱 결과 확인 UI) |
| **Phase 4** | 프론트: Step 3 모달 (중복 처리) + 완료 후 목록 갱신 |
