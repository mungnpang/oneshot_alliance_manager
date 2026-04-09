# 로그인 후 랜딩페이지 맥락 노트

## 결정 기록
| 결정 사항 | 선택지 | 최종 선택 | 이유 |
|-----------|--------|-----------|------|
| 유저 데이터 저장 위치 | 메모리(useState) / localStorage | localStorage | 새로고침 후에도 유지, token과 동일 패턴 |
| total_recharge_amount 노출 | 포함 / 제외 | 제외 | 사용자 요구사항 |
| 이미지 렌더링 | img 태그 / Next Image | Next Image | 최적화, 기존 코드와 동일 |

## 참조 자료
- 기존 auth 흐름: `frontend/src/lib/auth.ts`, `frontend/src/app/page.tsx`
- 킹샷 API 응답 필드: fid, nickname, kid, stove_lv, stove_lv_content, avatar_image
- 기존 UI 톤앤매너: `src/components/AuthCard.tsx` (dark navy + gold)

## 제약 조건
- 킹샷 이미지 URL이 외부 도메인 → `next.config.ts`에 `images.remotePatterns` 추가 필요
- `stove_lv_content`, `avatar_image`는 null일 수 있으므로 fallback 처리

## 사용자 요구사항 원문
> 로그인API 에 대한 응답값으로 total_recharge_amount 를 제외한 모든 유저 데이터를 반환하게 하고
> 로그인 후 도달하는 랜딩페이지 에서는 해당 데이터들을 바탕으로 아까 그 giftcode 페이지 처럼
> 유저 정보를 보여주는 섹션을 만들어줘. 다만 ui 적으로 톤앤 매너는 기존 ui 와 통일감있게
