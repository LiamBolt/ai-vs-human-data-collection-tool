"""Application configuration loaded from environment variables (Pydantic Settings)."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "postgresql+asyncpg://aivb:changeme@db:5432/aivbrain"

    # JWT
    jwt_secret: str = "change-this-to-a-long-random-secret-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expires_min: int = 720

    # Study protocol
    break_duration_seconds: int = 300

    # Group-assignment automation. If a proctor is active, they get this grace
    # window to assign manually before the server auto-assigns; with no active
    # proctor the server assigns immediately. proctor_presence_seconds is how
    # recently a proctor request must have arrived to count as "active".
    assignment_grace_seconds: int = 40
    proctor_presence_seconds: int = 25

    # Bootstrap admin (created on first startup if no staff users exist)
    admin_bootstrap_username: str = "admin"
    admin_bootstrap_password: str = "changeme-admin"

    # Double-scoring target probability (rater blinding / reliability)
    double_score_probability: float = 0.20

    # Meta
    api_prefix: str = "/api/v1"
    version: str = "1.0.0"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
