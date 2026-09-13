"""
Application configuration.

Settings are loaded from environment variables (see .env.example). We use
pydantic-settings so that configuration is validated at startup and typed
throughout the rest of the application.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings, populated from environment variables."""

    # General
    PROJECT_NAME: str = "BuildTrack API"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Database
    # Example Postgres:  postgresql://user:password@localhost:5432/buildtrack_db
    # Example SQLite:    sqlite:///./buildtrack.db
    DATABASE_URL: str = "sqlite:///./buildtrack.db"

    # Security / JWT
    SECRET_KEY: str = "replace_with_secure_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS / Frontend
    FRONTEND_URL: str = "http://localhost:4200"
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance so the .env file is parsed once."""
    return Settings()


settings = get_settings()
