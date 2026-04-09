# 유저 회원가입/로그인 체크리스트

## 작업 목록
- [x] Phase 1: Member 모델 재설계 + 마이그레이션
  - [x] member.py — fid, nickname, kid, stove_lv, stove_lv_content, avatar_image, total_recharge_amount, hashed_password, updated_at 추가
  - [x] Alembic 마이그레이션 작성 (기존 테이블 drop → recreate)
  - [x] bcrypt, httpx (main dependencies)
- [x] Phase 2: 킹샷 API 서비스
  - [x] app/services/kingshot_service.py 작성 (sign 생성 + fetch_player)
  - [x] KingshotAPIException 추가
- [x] Phase 3: 인증 엔드포인트
  - [x] app/core/security.py (bcrypt hash/verify + JWT 발급/검증)
  - [x] app/schemas/auth.py (RegisterRequest, LoginRequest, ChangePasswordRequest, TokenResponse)
  - [x] app/services/auth_service.py (register, login, change_password)
  - [x] app/api/v1/endpoints/auth.py (3 엔드포인트)
  - [x] app/api/v1/router.py — auth 라우터 include
- [x] Phase 4: 프론트엔드 인증 UI
  - [x] src/lib/auth.ts
  - [x] src/components/RegisterForm.tsx
  - [x] src/components/LoginForm.tsx
  - [x] src/components/ChangePasswordForm.tsx
  - [x] src/app/page.tsx 인증 흐름 연결

## 컨텍스트 전환 체크
- [x] 사용자 승인 완료
- [x] /compact 안내 출력 완료

## 품질 체크
- [x] 프론트 API 에러 `detail` 정규화 (`api-error.ts`)
- [ ] 보안 검토 (bcrypt, JWT exp, CORS) — 배포 전 `.env`·CORS 재확인
- [ ] 테스트 작성/통과 — 보류
