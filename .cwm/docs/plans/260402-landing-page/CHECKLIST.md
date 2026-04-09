# 로그인 후 랜딩페이지 체크리스트

## 작업 목록
- [x] Phase 1: 백엔드 — login 응답에 유저 데이터 추가
  - [x] app/schemas/auth.py — UserData, LoginResponse 추가
  - [x] app/services/auth_service.py — login() → (token, member) 튜플 반환
  - [x] app/api/v1/endpoints/auth.py — LoginResponse 사용
- [x] Phase 2: 프론트엔드 — 랜딩페이지 유저 프로필
  - [x] src/lib/auth.ts — UserData 타입, login 반환 타입, saveUser/getUser
  - [x] src/components/Dashboard.tsx — 유저 프로필 카드 (신규)
  - [x] src/app/page.tsx — 로그인 후 Dashboard 렌더링
  - [x] next.config.ts — 외부 이미지 도메인 허용

## 컨텍스트 전환 체크
- [x] 사용자 승인 완료
- [x] /compact 안내 출력 완료

## 품질 체크
- [x] 이미지 로드 실패 fallback (onError + unoptimized)
- [x] null 필드 안전 처리 (user?.nickname, kid != null 등)
