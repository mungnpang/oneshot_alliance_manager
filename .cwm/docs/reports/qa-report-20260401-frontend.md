# 품질관리 보고서 — 프론트엔드 업로드 UI

**작성일**: 2026-04-01
**대상 플랜**: 260401-screenshot-ocr-db / Phase 3

---

## 검토 요약

- 검토 파일: 4개
- 발견 이슈: 0건 (심각 0 / 경고 0 / 참고 0)
- 수정 완료: 0건
- 빌드 결과: 성공 (Next.js 16.2.2 Turbopack, TypeScript 검사 통과)

---

## 생성 파일 목록

| 파일 | 역할 |
|------|------|
| `frontend/src/lib/api.ts` | FastAPI `/api/v1/upload` 연동 클라이언트 |
| `frontend/src/components/UploadForm.tsx` | 이미지 업로드 + 결과 표시 Client Component |
| `frontend/src/app/page.tsx` | 루트 페이지 — UploadForm 렌더링 |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` 환경 변수 |

---

## 검토 내역

### api.ts

- `NEXT_PUBLIC_` 접두어로 환경 변수를 클라이언트 번들에 안전하게 노출
- `res.ok` 확인 후 에러 throw — 정상 흐름과 오류 흐름 명확히 분리
- `.catch(() => ({ detail: "업로드 실패" }))` 로 JSON 파싱 실패 방어 처리
- 이슈 없음

### UploadForm.tsx

- `"use client"` 지시어 적절히 선언 (useState, useRef, 이벤트 핸들러 사용)
- `loading` 상태로 중복 제출 방지 (`disabled={loading}`)
- `err instanceof Error` 체크로 unknown 타입 안전 처리
- `key={i}` 사용: 동맹원 목록은 순서가 변하지 않는 단순 표시용이므로 허용 수준
- 이슈 없음

### page.tsx

- Server Component로 유지하고 Client Component인 UploadForm을 import — 올바른 패턴
- 이슈 없음

### .env.local

- 로컬 개발용 기본값만 포함, 비밀 정보 없음
- 이슈 없음

---

## 구조 개선 제안

1. **파일 타입 검증 강화**: 현재 `accept` 속성으로 브라우저 레벨 필터링만 수행. 추후 업로드 전 `file.type` 체크를 추가하면 더 견고해짐.
2. **결과 없는 성공 처리**: API가 빈 `members` 배열을 반환할 때 사용자에게 안내 메시지가 없음. 빈 배열 케이스 UI 고려 가능.

---

## 잔여 리스크

- **CORS**: FastAPI 서버에서 `http://localhost:3000` origin을 허용하는 설정이 필요. 백엔드 `main.py`의 `CORSMiddleware` 설정에 의존.
- **파일 크기 제한**: 현재 클라이언트 측 파일 크기 제한 없음. 대용량 이미지 업로드 시 서버 타임아웃 가능성 있음.

---

## 빌드 로그 요약

```
▲ Next.js 16.2.2 (Turbopack)
✓ Compiled successfully in 1393ms
✓ TypeScript 검사 통과
✓ Static pages (4/4) 생성 완료

Route (app)
┌ ○ /
└ ○ /_not-found
```
