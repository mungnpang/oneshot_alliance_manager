# Chapter 03: Architecture

## 디렉토리 구조

```
oneshot/
├── backend/
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── main.py          # FastAPI 앱 진입점
│   │   ├── core/
│   │   │   ├── config.py    # 환경 변수 (pydantic-settings)
│   │   │   └── database.py  # SQLAlchemy 엔진/세션
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── router.py
│   │   │       └── endpoints/
│   │   ├── models/          # SQLAlchemy ORM 모델
│   │   ├── schemas/         # Pydantic 입출력 스키마
│   │   └── services/        # 비즈니스 로직
│   └── tests/
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/
│   │   └── lib/             # API 클라이언트 등
└── docker-compose.yml
```

## 데이터 흐름 (OCR)

```
[스크린샷 업로드]
      │
      ▼
[FastAPI /api/v1/upload]
      │
      ▼
[OCR Service: easyocr 텍스트 추출]
      │
      ▼
[Parser Service: 구조화된 데이터 파싱]
      │
      ▼
[DB Service: PostgreSQL 저장]
      │
      ▼
[응답: 추출 결과 반환]
```

## DB 스키마 (초안)

```sql
-- 동맹원 테이블
CREATE TABLE members (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- 스냅샷 기록 테이블
CREATE TABLE snapshots (
    id          SERIAL PRIMARY KEY,
    member_id   INTEGER REFERENCES members(id),
    score       INTEGER,
    raw_text    TEXT,             -- OCR 원본 텍스트 보존
    screenshot  VARCHAR(500),     -- 파일 경로
    captured_at TIMESTAMP DEFAULT NOW()
);
```
