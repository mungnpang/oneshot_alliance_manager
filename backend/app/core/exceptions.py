class OneshotException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail


class OCRFailedException(OneshotException):
    def __init__(self, detail: str = "OCR processing failed"):
        super().__init__(status_code=422, detail=detail)


class MemberNotFoundException(OneshotException):
    def __init__(self, member_id: int):
        super().__init__(status_code=404, detail=f"Member {member_id} not found")


class KingshotAPIException(OneshotException):
    def __init__(self, detail: str = "Kingshot API call failed"):
        super().__init__(status_code=502, detail=detail)


class AuthException(OneshotException):
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(status_code=401, detail=detail)
