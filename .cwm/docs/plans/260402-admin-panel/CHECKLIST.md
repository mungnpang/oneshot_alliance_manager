# 관리자 페이지 체크리스트

## 작업 목록
- [x] Phase 1: DB 스키마 — 모델 + 마이그레이션
  - [x] app/models/member.py — is_admin 컬럼 추가
  - [x] app/models/alliance.py — alliances 테이블
  - [x] app/models/alliance_member.py — alliance_members M2M
  - [x] app/models/event.py — events 테이블 + FrequencyEnum
  - [x] app/models/event_participation.py — event_participations 테이블
  - [x] app/models/__init__.py — 신규 모델 export
  - [x] alembic migration 생성 및 적용

- [x] Phase 2: 백엔드 관리자 API
  - [x] app/schemas/admin.py — 전체 스키마
  - [x] app/services/admin_service.py — CRUD 서비스
  - [x] app/api/v1/endpoints/admin.py — 라우터
  - [x] app/api/v1/endpoints/auth.py — get_current_admin 의존성 추가
  - [x] app/api/v1/router.py — admin 라우터 등록

- [x] Phase 3: 프론트엔드 어드민 페이지
  - [x] src/lib/admin-api.ts — 어드민 API 클라이언트
  - [x] src/app/admin/layout.tsx — auth guard (is_admin)
  - [x] src/app/admin/page.tsx — 어드민 로그인
  - [x] src/app/admin/dashboard/page.tsx — 대시보드
  - [x] src/app/admin/members/page.tsx — 멤버 관리
  - [x] src/app/admin/alliances/page.tsx — 연맹 관리
  - [x] src/app/admin/events/page.tsx — 이벤트 관리
  - [x] src/app/admin/events/[id]/participations/page.tsx — 참여 기록

## 컨텍스트 전환 체크
- [x] 사용자 승인 완료
- [x] /compact 안내 출력 완료

## 품질 체크
- [x] 모든 admin API is_admin 검증
- [x] nullable 필드 안전 처리
- [x] UNIQUE 제약 위반 시 명확한 에러 메시지
