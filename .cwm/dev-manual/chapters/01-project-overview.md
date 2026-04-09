# Chapter 01: Project Overview

## 프로젝트 소개

**oneshot** — Kingshot 게임의 동맹(Alliance) 관리 도구

### 핵심 기능
1. 스크린샷 → OCR 텍스트 추출 & DB 기록
2. DB 조회 및 클라이언트 노출
3. 히스토리 정렬 및 랭킹 산정
4. 기프트코드 자동 입력

### 아키텍처
```
frontend/          # Next.js (pnpm)
backend/           # FastAPI (poetry)
  ├── app/
  │   ├── api/     # 라우터
  │   ├── models/  # SQLAlchemy 모델
  │   ├── schemas/ # Pydantic 스키마
  │   ├── services/# 비즈니스 로직
  │   └── core/    # 설정, DB 연결
  └── alembic/     # 마이그레이션
docker-compose.yml # PostgreSQL 로컬
```

### 기술 스택
| 레이어 | 기술 |
|--------|------|
| 백엔드 | Python + FastAPI |
| 프론트 | JavaScript + Next.js |
| DB | PostgreSQL |
| ORM | SQLAlchemy 2.x |
| 마이그레이션 | Alembic |
| OCR | easyocr |
| 패키지 | poetry (py) / pnpm (js) |
| 테스트 | pytest |
