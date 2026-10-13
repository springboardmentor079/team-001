from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "BuildTrack API"
    DATABASE_URL: str = "sqlite:///./buildtrack.db"
    SECRET_KEY: str = "change-this-to-a-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Comma separated list of allowed frontend origins (CORS)
    CORS_ORIGINS: str = "http://localhost:4200"
    # Create demo users/data on startup if the database is empty (handy on hosts without a shell).
    # Turn it OFF for a real deployment: the demo accounts share a public password.
    SEED_DEMO_DATA: bool = False

    # Used to build the password-reset link that is emailed to users
    FRONTEND_URL: str = "http://localhost:4200"

    # Set False in production and use `alembic upgrade head` instead
    AUTO_CREATE_TABLES: bool = True
    # Set False in production so nobody can self-register as admin
    ALLOW_ADMIN_SIGNUP: bool = True

    # File uploads (document management)
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 10

    # Email (SMTP). Leave SMTP_HOST empty to run in dev mode (emails are logged only).
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "BuildTrack <no-reply@buildtrack.local>"

    class Config:
        env_file = ".env"

    @field_validator("DATABASE_URL")
    @classmethod
    def _normalise_database_url(cls, value: str) -> str:
        # Some hosts hand out "postgres://..." which SQLAlchemy 2.x no longer accepts.
        if value.startswith("postgres://"):
            return "postgresql://" + value[len("postgres://"):]
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def smtp_enabled(self) -> bool:
        return bool(self.SMTP_HOST)


settings = Settings()
