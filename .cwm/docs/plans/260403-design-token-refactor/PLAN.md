# 디자인 토큰 중앙화 및 타이포그래피 개선

## 목표
- `src/lib/theme.ts` 디자인 토큰 파일 생성
- `StarBackground` 컴포넌트 추출 (재사용)
- 모든 컴포넌트에서 하드코딩 색상/폰트를 theme 토큰으로 교체
- 타이포그래피 키우기 (11px → 13px+)
- 어드민 카드 레이아웃 정렬 개선

## 범위
- `src/lib/theme.ts` (신규)
- `src/components/StarBackground.tsx` (신규)
- `src/components/AuthCard.tsx`
- `src/components/LoginForm.tsx`
- `src/components/RegisterForm.tsx`
- `src/components/Dashboard.tsx`
- `src/app/admin/_components/AdminShell.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/dashboard/page.tsx`
- `src/app/admin/members/page.tsx`
- `src/app/admin/alliances/page.tsx`
- `src/app/admin/events/page.tsx`
- `src/app/admin/events/[id]/participations/page.tsx`
