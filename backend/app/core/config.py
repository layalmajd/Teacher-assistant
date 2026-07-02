import json
from functools import lru_cache
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Automated Project Evaluation System"
    environment: str = Field(default="development", alias="APP_ENV")
    api_v1_prefix: str = "/api/v1"
    backend_host: str = Field(default="0.0.0.0", alias="BACKEND_HOST")
    backend_port: int = Field(default=8000, alias="BACKEND_PORT")

    database_url: str = Field(alias="DATABASE_URL")
    cors_origins: list[str] = Field(default_factory=list, alias="CORS_ORIGINS")
    cors_origin_regex: str | None = Field(default=None, alias="CORS_ORIGIN_REGEX")

    jwt_secret_key: str = Field(alias="JWT_SECRET_KEY")
    jwt_refresh_secret_key: str = Field(alias="JWT_REFRESH_SECRET_KEY")
    access_token_expire_minutes: int = Field(default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=14, alias="REFRESH_TOKEN_EXPIRE_DAYS")
    api_key_encryption_key: str = Field(alias="API_KEY_ENCRYPTION_KEY")

    rate_limit_default: str = Field(default="120/minute", alias="RATE_LIMIT_DEFAULT")
    database_pool_recycle_seconds: int = Field(default=300, alias="DATABASE_POOL_RECYCLE_SECONDS")

    storage_root: Path = Field(default=Path("./uploads"), alias="STORAGE_ROOT")
    max_upload_batch_files: int = Field(default=300, alias="MAX_UPLOAD_BATCH_FILES")
    max_upload_file_size_mb: int = Field(default=20, alias="MAX_UPLOAD_FILE_SIZE_MB")
    allowed_file_extensions: list[str] = Field(
        default_factory=lambda: ["pdf", "docx", "txt"],
        alias="ALLOWED_FILE_EXTENSIONS",
    )
    allowed_archive_extensions: list[str] = Field(
        default_factory=lambda: ["zip"],
        alias="ALLOWED_ARCHIVE_EXTENSIONS",
    )
    max_archive_entries: int = Field(default=500, alias="MAX_ARCHIVE_ENTRIES")

    frontend_api_url: str = Field(default="http://localhost:8000/api/v1", alias="FRONTEND_API_URL")
    ollama_base_url: str = Field(default="http://localhost:11434", alias="OLLAMA_BASE_URL")
    batch_max_parallel_evaluations: int = Field(
        default=3,
        alias="BATCH_MAX_PARALLEL_EVALUATIONS",
        ge=1,
        le=20,
    )
    batch_max_parallel_evaluations_groq: int = Field(
        default=1,
        alias="BATCH_MAX_PARALLEL_EVALUATIONS_GROQ",
        ge=1,
        le=20,
    )
    batch_rate_limit_retry_attempts: int = Field(
        default=3,
        alias="BATCH_RATE_LIMIT_RETRY_ATTEMPTS",
        ge=0,
        le=10,
    )
    batch_rate_limit_retry_base_seconds: int = Field(
        default=2,
        alias="BATCH_RATE_LIMIT_RETRY_BASE_SECONDS",
        ge=1,
        le=60,
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        return parse_string_list(value)

    @field_validator("allowed_file_extensions", mode="before")
    @classmethod
    def parse_file_extensions(cls, value: str | list[str]) -> list[str]:
        return [item.lower().lstrip(".") for item in parse_string_list(value)]

    @field_validator("allowed_archive_extensions", mode="before")
    @classmethod
    def parse_archive_extensions(cls, value: str | list[str]) -> list[str]:
        return [item.lower().lstrip(".") for item in parse_string_list(value)]


def parse_string_list(value: str | list[str]) -> list[str]:
    if isinstance(value, list):
        return [item.strip() for item in value if item.strip()]
    if not value:
        return []

    stripped = value.strip()
    if stripped.startswith(("[", "{")):
        parsed = json.loads(stripped)
        if not isinstance(parsed, list):
            raise ValueError("Expected a JSON array")
        return [str(item).strip() for item in parsed if str(item).strip()]

    return [item.strip() for item in stripped.split(",") if item.strip()]


def sync_database_url(database_url: str) -> str:
    url = database_url.replace("+asyncpg", "+psycopg")
    parts = urlsplit(url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    if query.get("ssl") == "require":
        query.pop("ssl")
        query["sslmode"] = "require"
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


@lru_cache
def get_settings() -> Settings:
    return Settings()
