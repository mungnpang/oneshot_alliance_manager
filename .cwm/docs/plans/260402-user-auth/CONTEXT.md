# 유저 회원가입/로그인 맥락 노트

## 결정 기록
| 결정 사항 | 선택지 | 최종 선택 | 이유 |
|-----------|--------|-----------|------|
| 초기 비밀번호 | 랜덤 생성 / fid와 동일 | fid와 동일 | 관리자가 일괄 등록 후 유저가 변경하는 흐름 |
| fid 검증 방법 | 별도 검증 없음 / 킹샷 API 호출 | 킹샷 API 호출 | 존재하지 않는 fid 등록 방지 |
| HTTP 클라이언트 | requests / httpx | httpx | async 일관성, **프로덕션 의존성**으로 `pyproject` main에 선언 |
| 비밀번호 해시 | passlib / bcrypt 직접 | bcrypt 직접 | `app/core/security.py`에서 `bcrypt.hashpw` / `checkpw` |
| 토큰 방식 | Session / JWT | JWT | 기존 dev-manual 05-security.md 결정 사항 |
| 메타 업데이트 시점 | 가입 시만 / 로그인마다 | 로그인마다 | 닉네임·레벨 변경 반영 |

## 참조 자료
- 킹샷 giftcode API: `POST https://kingshot-giftcode.centurygame.com/api/player`
- sign 공식: `MD5("fid={fid}&time={time_ms}mN4!pQs6JrYwV9")`
- 응답 예시:
  ```json
  {
    "code": 0,
    "data": {
      "fid": 23789295, "nickname": "Starlette", "kid": 53,
      "stove_lv": 56, "stove_lv_content": "https://...",
      "avatar_image": "https://...", "total_recharge_amount": 0
    }
  }
  ```
- 참고 구현: https://github.com/justncodes/ks-giftcode (sign 로직 검증 완료)
- 기존 dev-manual: `.cwm/dev-manual/chapters/05-security.md`

## 제약 조건
- 킹샷 API는 공개 엔드포인트이나 rate limit 존재 가능
- fid는 정수형 8자리 (예: 23789295)
- 비밀번호 변경은 로그인된 유저만 가능 (JWT Bearer 토큰 필요)

## 사용자 요구사항 원문
> 1. 회원가입은 킹샷 id 만 받고 바로 진행. (비밀번호는 id와 동일하게 유저 생성)
> 2. 회원 가입 및 로그인 시에는 아까 그 API 를 통해서 유저의 메타 데이터를 기입 또는 업데이트
> 3. 다만 유저 개별적으로 추후 보안을 위해 비밀번호 변경 기능은 추가 (기존 비번 확인 및 변경)
