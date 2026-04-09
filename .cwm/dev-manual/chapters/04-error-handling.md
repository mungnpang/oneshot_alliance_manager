# Chapter 04: Error Handling

## Python (FastAPI)

### 커스텀 예외 클래스
```python
# app/core/exceptions.py
class OneshotException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail

class OCRFailedException(OneshotException):
    def __init__(self, detail: str = "OCR 처리에 실패했습니다"):
        super().__init__(status_code=422, detail=detail)

class MemberNotFoundException(OneshotException):
    def __init__(self, member_id: int):
        super().__init__(status_code=404, detail=f"멤버 {member_id}를 찾을 수 없습니다")
```

### 전역 예외 핸들러
```python
# app/main.py
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(OneshotException)
async def oneshot_exception_handler(request: Request, exc: OneshotException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
```

### 서비스 레이어에서 사용
```python
# DO
async def process_screenshot(file: UploadFile) -> ParsedData:
    result = ocr_engine.readtext(image)
    if not result:
        raise OCRFailedException("텍스트를 추출할 수 없습니다")
    return parse_result(result)

# DON'T — 예외를 삼키지 않는다
async def process_screenshot(file):
    try:
        result = ocr_engine.readtext(image)
    except:
        return None  # ❌
```

## JavaScript (Next.js)

```js
// DO — API 호출 시 에러 처리
async function uploadScreenshot(file) {
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail ?? '업로드 실패')
  }
  return res.json()
}
```
