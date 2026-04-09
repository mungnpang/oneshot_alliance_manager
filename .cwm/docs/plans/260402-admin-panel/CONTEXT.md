# 관리자 페이지 맥락 노트

## 결정 기록
| 결정 사항 | 선택지 | 최종 선택 | 이유 |
|-----------|--------|-----------|------|
| 어드민 프론트 분리 | 별도 프로젝트 / 같은 프로젝트 `/admin` | 같은 프로젝트 | 백엔드/DB 동일, auth 로직 재사용, 규모 작음 |
| 관리자 인증 | 별도 admin 테이블 / is_admin 컬럼 | is_admin 컬럼 | 기존 members 테이블과 통합, 단순함 |
| 연맹 가입 제약 | 다중 연맹 가능 / 한 연맹만 | alliance_members.member_id UNIQUE | 사용자 요구사항 |
| frequency 타입 | 자유 문자열 / Enum | Enum(daily/weekly/monthly/others) | 데이터 정합성, others로 예외 처리 |
| 이벤트 참여 중복 방지 | (event_id, member_id) / +start_date | UNIQUE(event_id, member_id, start_date) | 주기 반복 이벤트 지원 |
| extra_info 타입 | VARCHAR / JSONB | JSONB | 유연한 추가 정보 저장 |

## 참조 자료
- 기존 모델: `backend/app/models/member.py`, `backend/app/models/base.py`
- 기존 auth 패턴: `backend/app/api/v1/endpoints/auth.py`, `backend/app/core/security.py`
- 기존 서비스 패턴: `backend/app/services/auth_service.py`
- Alembic 설정: `backend/alembic/`, `backend/alembic.ini`

## 제약 조건
- alliances: name, alias, kid 필수 / 나머지 nullable (공식 API 없음)
- alliance_members.member_id UNIQUE → 한 멤버는 한 연맹에만 소속
- event_participations: (event_id, member_id, start_date) composite unique
- 모든 admin API: 유효한 JWT + is_admin=True 이중 검증

## 사용자 요구사항 원문
> 1. 연맹원 등록 및 정보 수정 삭제 기능
> 2. 이벤트 결과 등록 (db record 생성 포함)
> 3. 이벤트 기록 수정 및 삭제
> 4. 이벤트 결과 데이터 조회
>
> 연맹의 경우 다음 컬럼들을 가져야 해 (테이블 명은 alliances)
> 1. name: str, 2. alias: str, 3. kid: int, 4. leader: int (member fk)
> 5. power: int, 6. num_member: int, 7. language: str
> name, alias, kid 빼고는 전부 nullable
>
> 이벤트의 경우 테이블 명은 events
> 1. name: str, 2. eval_weight: float, 3. frequency: str, 4. description: str
>
> 유저들의 이벤트 참여 이력은 event_participations
> 1. event_id, 2. member_id, 3. is_participated: bool
> 4. score: int, 5. extra_info: jsonb, 6. start_date, 7. end_date
>
> alliance_members: alliances <-> members M2M, member_id UNIQUE
