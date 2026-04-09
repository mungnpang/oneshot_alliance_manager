# Cursor Pagination 계획서

## 개요
- **목적**: 데이터 증가에 대비해 Members, Alliance Members, Event Occurrences 3개 목록 API에 cursor 기반 페이지네이션 적용
- **범위**: Backend 3개 service 함수 + 3개 endpoint + schemas / Frontend 3개 페이지 UI
- **예상 단계**: 3 Phase

## 현재 상태 분석

### 정렬 기준
| API | 현재 정렬 |
|-----|-----------|
| `list_members` | `Member.id` ASC |
| `list_alliance_members` | 정렬 없음 (DB 순) |
| `list_occurrences` | `period_start` DESC |

### 문제
- 세 함수 모두 `.all()`로 전체 조회 — 100명 연맹 × N 연맹 시 메모리·응답 비효율
- 프론트엔드도 한 번에 전체를 state에 올림

## 구현 계획

### Phase 1: Backend — 공통 cursor 스키마 + 3개 엔드포인트 수정

**Cursor 방식 선택: keyset pagination (id 또는 정렬 컬럼 기준)**
- `cursor`: 마지막 항목의 커서값 (opaque base64 인코딩, 내부적으로 `id` or `period_start|id`)
- `limit`: 페이지 크기 (기본 50, 최대 200)
- 응답: `{ items: [...], next_cursor: str | null }`

**변경 파일**
- `backend/app/schemas/admin.py` — `CursorPage[T]` 제네릭 응답 스키마, `cursor` / `limit` 쿼리 파라미터
- `backend/app/services/admin_service.py` — `list_members`, `list_alliance_members`, `list_occurrences` 수정
- `backend/app/api/v1/endpoints/admin.py` — 3개 GET 엔드포인트에 `cursor`, `limit` 쿼리 파라미터 추가

**Cursor 인코딩**
```python
# cursor = base64(json({"id": 123}))  또는  base64(json({"ts": "2024-...", "id": 5}))
import base64, json
def encode_cursor(data: dict) -> str:
    return base64.urlsafe_b64encode(json.dumps(data).encode()).decode()
def decode_cursor(cursor: str) -> dict:
    return json.loads(base64.urlsafe_b64decode(cursor))
```

### Phase 2: Frontend — admin-api.ts 타입 + 3개 페이지 UI

**변경 파일**
- `frontend/src/lib/admin-api.ts` — `CursorPage<T>` 인터페이스, 3개 API 함수 시그니처 수정
- `frontend/src/app/admin/members/page.tsx` — 하단 "Load More" 버튼 + next_cursor 관리
- `frontend/src/app/admin/alliances/page.tsx` — 토글 열릴 때 첫 페이지 로드, 하단 "Load More"
- `frontend/src/app/admin/events/page.tsx` — 토글 열릴 때 첫 페이지 로드, 하단 "Load More"

**UI 패턴**: infinite-style "Load More" 버튼 (next_cursor가 null이면 버튼 숨김)

### Phase 3: 검증

- 각 API limit=2 로 테스트해서 cursor가 올바르게 작동하는지 확인
- next_cursor가 null일 때 "Load More" 버튼이 사라지는지 확인

## 기술 선택

| 결정 | 선택 | 이유 |
|------|------|------|
| Offset vs Cursor | **Cursor (keyset)** | 데이터 삽입/삭제 중에도 중복·누락 없음, DB 인덱스 효율적 |
| Cursor 포맷 | **base64(JSON)** | opaque token, 내부 구조 변경 자유 |
| 프론트 패턴 | **Load More** | 테이블 컨텍스트에서 자연스럽고 구현 단순 |
| 기본 limit | **50** | 연맹 최대 100명 기준 첫 페이지에 절반, 두 번이면 전체 |

## 리스크

- `list_members`는 `Member + Alliance JOIN` 쿼리 — cursor를 `Member.id` 기준으로 적용하면 JOIN 후에도 정렬이 안정적
- 기존 프론트 `members` state가 배열로 누적되어야 함 (교체 X, 추가 append)
