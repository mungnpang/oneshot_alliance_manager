# Chapter 02: Coding Standards

## Python (FastAPI)

### 네이밍
```python
# DO
def get_member_by_id(member_id: int): ...
class MemberService: ...
TABLE_NAME = "members"

# DON'T
def getMemberById(memberId): ...
```

### Import 순서 (isort 기준)
```python
# 1. 표준 라이브러리
import os
from datetime import datetime

# 2. 서드파티
from fastapi import FastAPI, UploadFile
from sqlalchemy.orm import Session

# 3. 내부 모듈
from app.models.member import Member
from app.schemas.member import MemberCreate
```

### 타입 힌트 필수
```python
# DO
async def create_member(data: MemberCreate, db: Session) -> Member:
    ...

# DON'T
async def create_member(data, db):
    ...
```

## JavaScript (Next.js)

### 네이밍
```js
// DO
const memberList = []
function uploadScreenshot(file) {}
const MemberCard = () => {}   // 컴포넌트는 PascalCase

// DON'T
const member_list = []
function upload_screenshot(file) {}
```

### 컴포넌트 구조
```jsx
// DO - 관심사 분리
const MemberCard = ({ member }) => {
  return <div>{member.name}</div>
}

export default MemberCard
```
