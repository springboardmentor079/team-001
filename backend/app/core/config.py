"""
Application configuration — reads values from environment variables / .env file.
"""
import os
from functools import lru_cache

from pydantic_settings import BaseSettings  # pydantic v2


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql://buildtrack_user:buildtrack_pass@localhost:5432/buildtrack_db"

    # ── JWT ───────────────────────────────────────────────────────────────────
    SECRET_KEY: str = "changeme-super-secret-key-at-least-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # ── App ───────────────────────────────────────────────────────────────────
    APP_NAME: str = "BuildTrack API"
    DEBUG: bool = False

    # ── CORS ──────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = ["http://localhost:4200"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
