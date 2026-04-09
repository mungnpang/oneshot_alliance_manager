# 유저 회원가입/로그인 with 킹샷 API 연동 계획서

## 개요
- **목적**: 킹샷 fid 기반 회원가입·로그인·비밀번호 변경 기능 구현
- **범위**: backend 모델/서비스/엔드포인트 + frontend 인증 UI
- **상태**: 구현 완료 (이 문서는 당시 계획 + 현재 코드 기준 요약)

## 구현 결과 스냅샷 (코드 기준)
- **Member** (`app/models/member.py`): fid, 킹샷 메타 필드, `hashed_password`, `is_admin`, 타임스탬프
- **인증**: `app/core/security.py` — `bcrypt` 직접 해시/검증, `python-jose` JWT 발급·검증
- **킹샷 연동**: `app/services/kingshot_service.py` — `httpx` 비동기 호출, `KingshotAPIException`
- **API**: `app/api/v1/endpoints/auth.py` — register / login / change-password; 관리자용 `get_current_admin` 동일 모듈
- **프론트**: `src/lib/auth.ts`, `src/lib/api-config.ts`, `src/lib/api-error.ts`, Register/Login/ChangePassword 폼, `page.tsx` 분기
- **관리자**: `POST /api/v1/admin/members` 는 `auth_service.register` 가 만든 `Member` 를 그대로 반환 (추가 조회 없음)

## 당시 구현 계획 (Phase 1~4)

### Phase 1: Member 모델 재설계 + 마이그레이션
킹샷 `/api/player` 응답값 + 인증 필드.

**Member 모델 필드**
| 필드 | 타입 | 설명 |
|------|------|------|
| id | Integer PK | 내부 ID |
| fid | Integer UNIQUE NOT NULL | 킹샷 8자리 고유 ID |
| nickname | String(100) | 닉네임 (API에서 취득) |
| kid | Integer | 왕국 번호 |
| stove_lv | Integer | 스토브 레벨 |
| stove_lv_content | String(500) | 스토브 레벨 이미지 URL |
| avatar_image | String(500) | 아바타 이미지 URL |
| total_recharge_amount | Integer | 총 충전액 |
| hashed_password | String(256) | bcrypt 해시 |
| is_admin | Boolean | 관리자 플래그 (DB에서 수동 부여) |
| created_at / updated_at | DateTime | 생성·갱신 시각 |

### Phase 2: 킹샷 API 서비스
- sign: `MD5("fid={fid}&time={time_ms}mN4!pQs6JrYwV9")`
- `fetch_player(fid)` — 실패 시 `KingshotAPIException`

### Phase 3: 인증 엔드포인트
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/v1/auth/register` | fid → 킹샷 검증 후 멤버 생성, 초기 비밀번호=fid 문자열, JWT 반환 |
| POST | `/api/v1/auth/login` | fid + password → JWT, 메타 업데이트(킹샷 실패 시 무시) |
| POST | `/api/v1/auth/change-password` | JWT 필요, 현재 비밀번호 확인 후 변경 |

### Phase 4: 프론트엔드 인증 UI
- `src/lib/auth.ts` — 토큰/유저 로컬 저장, 인증 API
- 폼 컴포넌트 + 랜딩 분기

## 기술 선택 (실제 적용)
- **Password hashing**: `bcrypt` 패키지 직접 사용 (`hashpw` / `checkpw`), DB 컬럼에 문자열 해시 저장
- **JWT**: `python-jose[cryptography]`, HS256, `sub`에 member id
- **HTTP client**: `httpx` — **런타임 의존성**(킹샷 호출); pytest용으로만 쓰이지 않음

## 리스크
- 킹샷 API rate limit → 로그인 시 메타 갱신 실패해도 로그인은 허용
- fid 검증 → 회원가입 시 킹샷 API 성공 여부로 검증
