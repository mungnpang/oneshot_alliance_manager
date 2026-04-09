# 스크린샷 OCR & DB 기록 체크리스트

## 작업 목록
- [x] Phase 1: 프로젝트 초기 세팅
  - [x] backend/ — poetry 초기화 및 FastAPI 의존성 설치
  - [x] frontend/ — pnpm + Next.js 초기화
  - [x] Docker Compose로 PostgreSQL 로컬 실행 설정
  - [x] DB 스키마 설계 및 Alembic 마이그레이션 초기화
- [x] Phase 2: OCR 백엔드 구현
  - [x] FastAPI `/upload` 엔드포인트 작성
  - [x] easyocr 연동 및 텍스트 추출 로직
  - [x] 추출 텍스트 파싱 (동맹원 데이터 구조화)
  - [x] SQLAlchemy 모델 정의 및 DB 저장
  - [x] pytest 단위 테스트 작성
- [x] Phase 3: 프론트엔드 업로드 UI
  - [x] Next.js 이미지 업로드 컴포넌트
  - [x] FastAPI 연동
  - [x] 결과 표시 UI

## 컨텍스트 전환 체크
- [x] 사용자 승인 완료
- [x] /compact 안내 출력 완료

## 품질 체크
- [x] 에러 처리 적용
- [x] 보안 검토
- [x] 테스트 작성/통과
