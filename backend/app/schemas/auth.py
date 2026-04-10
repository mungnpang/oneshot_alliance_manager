from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    fid: int = Field(..., description="Kingshot 8-digit unique ID")


class LoginRequest(BaseModel):
    fid: int
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=4)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserData(BaseModel):
    id: int
    fid: int
    nickname: str | None
    kid: int | None
    stove_lv: int | None
    stove_lv_content: str | None
    avatar_image: str | None
    is_admin: bool
    alliance_alias: str | None = None

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserData
