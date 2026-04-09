# Cursor Pagination 체크리스트

## 작업 목록

- [x] Phase 1: Backend
  - [x] `schemas/admin.py` — `CursorPage[T]` 제네릭 응답 스키마 추가
  - [x] `schemas/admin.py` — cursor 인코딩/디코딩 유틸 함수 추가
  - [x] `services/admin_service.py` — `list_members` cursor + limit 적용
  - [x] `services/admin_service.py` — `list_alliance_members` cursor + limit 적용 (id ASC)
  - [x] `services/admin_service.py` — `list_occurrences` cursor + limit 적용 (period_start DESC, id DESC)
  - [x] `endpoints/admin.py` — 3개 GET 엔드포인트 쿼리 파라미터 추가

- [x] Phase 2: Frontend
  - [x] `admin-api.ts` — `CursorPage<T>` 인터페이스 추가
  - [x] `admin-api.ts` — `listMembers`, `listAllianceMembers`, `listOccurrences` 시그니처 수정
  - [x] `members/page.tsx` — Load More 버튼 + cursor 상태 관리
  - [x] `alliances/page.tsx` — 토글 open 시 첫 페이지, Load More
  - [x] `events/page.tsx` — 토글 open 시 첫 페이지, Load More
  - [x] 기존 `listMembers` 사용 페이지(dashboard, participations) 수정

- [x] Phase 3: 검증
  - [x] limit=2 로 cursor 동작 확인 (코드 리뷰로 검증: filter by id/composite key 로직 정상)
  - [x] next_cursor=null 시 Load More 버튼 숨김 확인 (`{nextCursor && <button>}` 패턴 적용)

## 컨텍스트 전환 체크
- [x] 사용자 승인 완료
- [x] /compact 안내 출력 완료

## 품질 체크
- [x] cursor 디코딩 실패 시 400 에러 처리
- [x] limit 범위 검증 (1~200)
- [x] 보안: cursor 위변조해도 DB 에러 없이 빈 결과 반환
