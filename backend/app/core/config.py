from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "BuildTrack API"
    DATABASE_URL: str = "sqlite:///./buildtrack.db"
    SECRET_KEY: str = "change-this-to-a-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"


settings = Settings()
