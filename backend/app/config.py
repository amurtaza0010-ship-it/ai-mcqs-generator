import json
from functools import lru_cache
from typing import List, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    database_url: str = "sqlite:///./mcq.db"
    secret_key: str = "change-me"
    jwt_secret_key: str | None = None
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # ✅ Union — dono accept karega
    cors_origins: Union[List[str], str] = '["http://localhost:3000"]'

    max_file_size: int = 10_485_760
    upload_dir: str = "./uploads"
    openrouter_api_key: str | None = None
    openai_api_key: str | None = None
    ai_model: str = "openai/gpt-4o-mini"
    redis_url: str = "redis://localhost:6379/0"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        # Agar already list hai — as-is return karo
        if isinstance(value, list):
            return value
        # Agar string hai — JSON parse karo
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                return [o.strip() for o in value.split(",") if o.strip()]
        return [value]

    @property
    def jwt_key(self) -> str:
        return self.jwt_secret_key or self.secret_key


@lru_cache
def get_settings() -> Settings:
    return Settings()