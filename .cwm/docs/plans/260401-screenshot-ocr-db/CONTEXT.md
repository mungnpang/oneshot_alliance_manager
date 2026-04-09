# 스크린샷 OCR & DB 기록 맥락 노트

## 결정 기록
| 결정 사항 | 선택지 | 최종 선택 | 이유 |
|-----------|--------|-----------|------|
| OCR 라이브러리 | pytesseract / easyocr | easyocr | 한영 혼용 스크린샷 대응 |
| 프로젝트 구조 | 모노레포 / 별도 레포 | 모노레포 (backend/ + frontend/) | 단일 레포 관리 편의 |
| DB 로컬 실행 | 직접 설치 / Docker | Docker Compose | 환경 재현성 |
| ORM | SQLAlchemy / tortoise-orm | SQLAlchemy 2.x | FastAPI 공식 권장 |

## 참조 자료
- [FastAPI 공식 문서](https://fastapi.tiangolo.com)
- [easyocr GitHub](https://github.com/JaidedAI/EasyOCR)
- [SQLAlchemy 2.x 가이드](https://docs.sqlalchemy.org/en/20/)
- [Alembic 공식 문서](https://alembic.sqlalchemy.org)

## 제약 조건
- 로컬 환경 전용 (배포 미정)
- 킹샷 스크린샷 포맷에 특화된 파싱 필요

## 사용자 요구사항 원문
> "스크린샷으로부터 텍스트 추출 및 db 기록"
> 프로젝트: oneshot — alliance manager of kingshot
