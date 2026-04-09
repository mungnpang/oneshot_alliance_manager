# Chapter 05: Security

## 비밀번호 (bcrypt)

실제 구현은 `passlib` 없이 `bcrypt` 패키지를 직접 사용한다.

```python
# app/core/security.py (요지)
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())
```

## 인증 (JWT)

```python
# app/core/security.py
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = settings.secret_key  # 환경 변수에서 로드
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=24)):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + expires_delta
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

## 파일 업로드 보안

```python
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

async def validate_upload(file: UploadFile):
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise OneshotException(400, "허용되지 않는 파일 형식입니다")
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise OneshotException(413, "파일 크기가 너무 큽니다")
    await file.seek(0)
```

## 환경 변수 관리

```python
# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    debug: bool = False

    class Config:
        env_file = ".env"

settings = Settings()
```

```
# .env (절대 git에 커밋하지 않는다)
DATABASE_URL=postgresql://user:password@localhost:5432/oneshot
SECRET_KEY=your-secret-key-here
```

```
# .gitignore 필수 항목
.env
.env.local
```
