# Cursor Pagination 맥락 노트

## 결정 기록

| 결정 사항 | 선택지 | 최종 선택 | 이유 |
|-----------|--------|-----------|------|
| 페이지네이션 방식 | Offset, Cursor | Cursor (keyset) | 대용량에서 offset은 DB가 앞 페이지를 전부 읽음, cursor는 인덱스 직접 탐색 |
| cursor 포맷 | 컬럼값 노출, base64 opaque | base64(JSON) | 내부 구조 숨김, 클라이언트가 파싱 불필요 |
| 응답 구조 | items+next_cursor, Link header | `{ items, next_cursor }` | 프론트 처리 단순, REST 관례 |
| 프론트 UX | 무한 스크롤, Load More 버튼 | Load More 버튼 | 어드민 테이블 특성상 의도적 로드가 자연스러움 |
| 기본 limit | 20, 50, 100 | 50 | 연맹 최대 100명 → 2페이지면 전체 조회 가능 |

## 참조 자료
- 현재 list 함수: `backend/app/services/admin_service.py` L48, L132, L230
- 현재 엔드포인트: `backend/app/api/v1/endpoints/admin.py`
- 프론트 API 클라이언트: `frontend/src/lib/admin-api.ts`

## 제약 조건
- `list_members`는 `Member + AllianceMember + Alliance` JOIN 구조 — cursor는 `Member.id` 기준 단일 컬럼
- `list_occurrences`는 `period_start DESC` 정렬 — cursor는 `(period_start, id)` 복합 keyset 필요 (같은 start_date가 있을 수 있음)
- `list_alliance_members`는 현재 정렬 없음 — `AllianceMember.id` ASC로 고정

## 사용자 요구사항 원문
> "나중에 record 가 쌓였을때가 좀 불안한데, 기존에 멤버, 연맹원 조회, 이벤트 회차조회 같은 API 들은 cursor pagination 이 적용되야 할거같아."
