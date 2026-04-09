# Chapter 06: Testing

## pytest 구조

```
backend/tests/
├── conftest.py        # 공통 픽스처 (DB 세션, 클라이언트)
├── test_ocr.py        # OCR 서비스 단위 테스트
├── test_parser.py     # 파싱 로직 단위 테스트
└── test_api.py        # API 통합 테스트
```

## conftest.py 기본 구성

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import get_db
from app.models.base import Base

TEST_DATABASE_URL = "postgresql://user:password@localhost:5432/oneshot_test"

@pytest.fixture(scope="session")
def db_engine():
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)

@pytest.fixture
def db_session(db_engine):
    Session = sessionmaker(bind=db_engine)
    session = Session()
    yield session
    session.rollback()
    session.close()

@pytest.fixture
def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    return TestClient(app)
```

## 테스트 작성 규칙

```python
# DO — given/when/then 패턴
def test_parse_screenshot_text_extracts_member_name():
    # given
    raw_text = "홍길동  전투력  1,234,567"

    # when
    result = parse_member_data(raw_text)

    # then
    assert result.name == "홍길동"
    assert result.score == 1234567

# DON'T — 테스트명이 모호한 경우
def test_parse():  # ❌
    ...
```
