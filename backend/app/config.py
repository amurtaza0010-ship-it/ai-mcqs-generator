import json
from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite:///./mcq.db"
    secret_key: str = "change-me"
    jwt_secret_key: str | None = None
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    cors_origins: List[str] = [
    "http://localhost:3000",
    "https://ai-mcqs-generator-7qmplvwye-ali-murtaza-s-projects1.vercel.app",
    "https://ai-mcqs-generator.vercel.app"
    ]
    max_file_size: int = 10_485_760
    upload_dir: str = "./uploads"
    openrouter_api_key: str | None = None
    openai_api_key: str | None = None
    ai_model: str = "openai/gpt-4o-mini"
    redis_url: str = "redis://localhost:6379/0"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def jwt_key(self) -> str:
        return self.jwt_secret_key or self.secret_key


@lru_cache
def get_settings() -> Settings:
    return Settings()
