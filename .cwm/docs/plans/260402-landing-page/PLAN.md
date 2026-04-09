# 로그인 후 랜딩페이지 — 유저 프로필 섹션 계획서

## 개요
- **목적**: 로그인 API가 유저 데이터를 반환하고, 로그인 후 도달하는 랜딩페이지에서 유저 정보를 표시
- **범위**: backend 스키마/서비스/엔드포인트 + frontend auth 클라이언트/Dashboard 컴포넌트/page.tsx
- **예상 단계**: 2 Phase

## 현재 상태 분석
- `POST /api/v1/auth/login` → `{ access_token, token_type }` 만 반환 (유저 데이터 없음)
- 로그인 후 `page.tsx`는 `ChangePasswordForm + UploadForm`을 바로 렌더링
- `MemberResponse` 스키마 존재하나 login 응답에 미사용

## 구현 계획

### Phase 1: 백엔드 — login 응답에 유저 데이터 추가
**변경 파일**
- `app/schemas/auth.py` — `UserData`, `LoginResponse` 추가
- `app/services/auth_service.py` — `login()` → `(token, member)` 튜플 반환
- `app/api/v1/endpoints/auth.py` — login 엔드포인트 `LoginResponse` 사용

**LoginResponse 구조**
```json
{
  "access_token": "...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "fid": 23789295,
    "nickname": "Starlette",
    "kid": 53,
    "stove_lv": 56,
    "stove_lv_content": "https://...",
    "avatar_image": "https://..."
  }
}
```

### Phase 2: 프론트엔드 — 랜딩페이지 유저 프로필 섹션
**변경/신규 파일**
- `src/lib/auth.ts` — `UserData` 타입, `login()` 반환 타입 업데이트, `saveUser/getUser` 추가
- `src/components/Dashboard.tsx` — 유저 프로필 카드 (신규)
- `src/app/page.tsx` — 로그인 후 Dashboard 렌더링

**Dashboard UI 구성**
- 상단 네비바: 닉네임 + 로그아웃 버튼
- 프로필 카드: 아바타 이미지, 닉네임, fid, 왕국(kid), 스토브 레벨 + 이미지
- 톤앤매너: 기존 다크 네이비 + 골드 테마 통일

## 기술 선택
- 유저 데이터 저장: `localStorage` (token과 동일한 방식, `USER_KEY`)
- 이미지: Next.js `<Image>` 컴포넌트, 외부 도메인 허용 설정 필요

## 리스크
- 킹샷 아바타/스토브 이미지가 외부 URL → `next.config` 이미지 도메인 허용 필요
- 이미지 로드 실패 시 fallback 처리
