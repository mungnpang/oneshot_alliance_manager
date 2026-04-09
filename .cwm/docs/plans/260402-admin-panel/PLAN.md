# 관리자 페이지 계획서

## 개요
- **목적**: 연맹원 관리, 이벤트 관리, 이벤트 참여 기록 CRUD를 위한 관리자 페이지 구축
- **범위**: backend (모델/마이그레이션/API) + frontend `/admin` 라우트
- **예상 단계**: 3 Phase

## 현재 상태 분석
- `members` 테이블 존재 (fid, nickname, kid 등 킹샷 필드 + hashed_password)
- Alembic 마이그레이션 2개 존재 (초기 생성 + 리디자인)
- `is_admin` 필드 없음
- 연맹/이벤트 관련 모델 전혀 없음
- 관리자 API 엔드포인트 없음

## 구현 계획

### Phase 1: DB 스키마 — 모델 + 마이그레이션

**신규/변경 파일**
- `app/models/member.py` — `is_admin: bool` 컬럼 추가
- `app/models/alliance.py` — `alliances` 테이블
- `app/models/alliance_member.py` — `alliance_members` M2M 테이블
- `app/models/event.py` — `events` 테이블 (FrequencyEnum 포함)
- `app/models/event_participation.py` — `event_participations` 테이블
- `app/models/__init__.py` — 신규 모델 export
- `alembic/versions/XXXX_admin_and_event_tables.py` — 마이그레이션

**테이블 스펙**

`alliances`
- id (PK), name: str, alias: str, kid: int
- leader_id: int | None (FK → members.id)
- power: int | None, num_member: int | None, language: str | None
- created_at, updated_at

`alliance_members`
- id (PK)
- alliance_id: int (FK → alliances.id)
- member_id: int (FK → members.id, UNIQUE — 한 연맹만 가입)
- joined_date: datetime | None

`events`
- id (PK), name: str, eval_weight: float
- frequency: Enum(daily, weekly, monthly, others)
- description: str | None
- created_at, updated_at

`event_participations`
- id (PK)
- event_id: int (FK → events.id)
- member_id: int (FK → members.id)
- is_participated: bool (default False)
- score: int | None
- extra_info: JSONB | None
- start_date: datetime, end_date: datetime | None
- UNIQUE(event_id, member_id, start_date)

### Phase 2: 백엔드 관리자 API

**신규/변경 파일**
- `app/schemas/admin.py` — 어드민 관련 Pydantic 스키마 전체
- `app/services/admin_service.py` — CRUD 서비스 로직
- `app/api/v1/endpoints/admin.py` — 라우터
- `app/api/v1/router.py` — admin 라우터 등록
- `app/api/v1/endpoints/auth.py` — `get_current_admin` 의존성 추가

**엔드포인트 목록**

인증: 모든 admin 엔드포인트는 `Authorization: Bearer <token>` + `is_admin=True` 검증

```
# 멤버 관리
GET    /api/v1/admin/members              목록 조회
GET    /api/v1/admin/members/{id}         단건 조회
PUT    /api/v1/admin/members/{id}         정보 수정
DELETE /api/v1/admin/members/{id}         삭제

# 연맹 관리
GET    /api/v1/admin/alliances            목록 조회
POST   /api/v1/admin/alliances            생성
GET    /api/v1/admin/alliances/{id}       단건 조회
PUT    /api/v1/admin/alliances/{id}       수정
DELETE /api/v1/admin/alliances/{id}       삭제
POST   /api/v1/admin/alliances/{id}/members       멤버 등록
DELETE /api/v1/admin/alliances/{id}/members/{mid} 멤버 제거

# 이벤트 관리
GET    /api/v1/admin/events               목록 조회
POST   /api/v1/admin/events               생성
GET    /api/v1/admin/events/{id}          단건 조회
PUT    /api/v1/admin/events/{id}          수정
DELETE /api/v1/admin/events/{id}          삭제

# 이벤트 참여 기록
GET    /api/v1/admin/events/{id}/participations   이벤트별 참여 기록 조회
POST   /api/v1/admin/events/{id}/participations   기록 등록
PUT    /api/v1/admin/participations/{id}           수정
DELETE /api/v1/admin/participations/{id}           삭제
```

### Phase 3: 프론트엔드 어드민 페이지

**신규/변경 파일**
- `src/app/admin/layout.tsx` — 어드민 레이아웃 (auth guard: is_admin 확인)
- `src/app/admin/page.tsx` — 어드민 로그인 페이지
- `src/app/admin/dashboard/page.tsx` — 대시보드 (멤버/연맹/이벤트 요약)
- `src/app/admin/members/page.tsx` — 멤버 목록 + 수정/삭제
- `src/app/admin/alliances/page.tsx` — 연맹 목록 + CRUD
- `src/app/admin/events/page.tsx` — 이벤트 목록 + CRUD
- `src/app/admin/events/[id]/participations/page.tsx` — 이벤트 참여 기록
- `src/lib/admin-api.ts` — 어드민 API 클라이언트

## 기술 선택
- `is_admin` 체크: FastAPI Depends로 `get_current_admin()` 의존성 주입 → 토큰 유효 + is_admin=True 동시 검증
- JSONB: SQLAlchemy `JSON` 타입 (PostgreSQL에서 자동 JSONB)
- Enum: Python `enum.Enum` + SQLAlchemy `Enum` 타입
- 프론트 테이블 UI: 별도 라이브러리 없이 인라인 스타일 테이블 (기존 톤앤매너 유지)

## 리스크
- `alliance_members.member_id` UNIQUE 제약: 멤버 재가입 시 기존 레코드 업데이트 필요
- Alembic autogenerate가 Enum 타입을 제대로 감지 못할 수 있음 → 수동 확인 필요
