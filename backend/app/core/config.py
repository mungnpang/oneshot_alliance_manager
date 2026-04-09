from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://oneshot:oneshot@localhost:5432/oneshot"
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    debug: bool = False
    gemini_api_key: str = ""
    # Comma-separated allowed origins, e.g. "https://my-app.vercel.app,http://localhost:3000"
    allowed_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
