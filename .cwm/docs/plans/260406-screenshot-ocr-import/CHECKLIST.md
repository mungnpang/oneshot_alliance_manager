# 스크린샷 OCR 참여 기록 체크리스트

## Phase 1 — 백엔드

- [x] `pyproject.toml` — `google-genai`, `rapidfuzz` 의존성 추가 및 `poetry install`
- [x] `app/services/screenshot_service.py` (신규)
  - [x] Gemini Flash Vision API 호출 (여러 이미지, 중복 제거)
  - [x] alliance_tag 기반 멤버 풀 필터링 로직
  - [x] rapidfuzz 퍼지 매칭 (threshold=60, confidence 반환)
- [x] `app/schemas/admin.py` — 스키마 추가
  - [x] `ParsedMember`, `ParseScreenshotResponse`
  - [x] `BulkRecord`, `BulkParticipationRequest`, `BulkParticipationResponse`, `DuplicateRecord`
- [x] `app/api/v1/endpoints/admin.py` — 엔드포인트 추가
  - [x] `POST /occurrences/{occurrence_id}/parse-screenshots` (multipart)
  - [x] `POST /occurrences/{occurrence_id}/bulk-participations`
- [x] `app/core/config.py` — `gemini_api_key` 설정 추가

## Phase 2 — 프론트 Step 1 (업로드 모달)

- [x] `src/lib/admin-api.ts`
  - [x] ParsedMember, BulkRecord, DuplicateRecord 등 타입 추가
  - [x] `parseScreenshots(occurrenceId, files[])` 함수
  - [x] `bulkCreateParticipations(occurrenceId, records, upsert)` 함수
- [x] `participations/page.tsx`
  - [x] "Upload Screenshot" 버튼 (Add Record 옆)
  - [x] Step 1 모달: 파일 input (multiple, image/*), drag-drop, 썸네일 미리보기, Analyze 버튼
  - [x] 로딩 스피너 상태

## Phase 3 — 프론트 Step 2 (결과 확인 모달)

- [x] Step 2 모달 (큰 모달)
  - [x] 컬럼: Raw Name | Matched Member (드롭다운) | Score | 포함 체크박스 | 행 삭제 버튼
  - [x] 매칭 실패 row 하이라이트
  - [x] 드롭다운 — 모든 멤버 목록, 매칭된 멤버 pre-select
  - [x] Confirm 버튼 → bulkCreateParticipations 호출 (upsert=false)

## Phase 4 — 프론트 Step 3 (중복 처리 모달) + 마무리

- [x] Step 3 모달 (중복 경고)
  - [x] 중복 목록: 멤버명 | 기존 score | 새 score
  - [x] "Confirm & Upsert" → bulkCreateParticipations (중복 records만, upsert=true)
  - [x] "Skip Duplicates" → 모달 닫기
- [x] 완료 후 participation 목록 갱신 (refetch)

## 컨텍스트 체크
- [x] 사용자 승인 완료
- [x] Gemini API 키 환경변수 설정 (`GEMINI_API_KEY`)
