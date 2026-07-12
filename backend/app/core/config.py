"""Centralised, environment-based configuration.

All secrets and deployment-specific values are read from environment variables
(or a local `.env` file in development). Nothing sensitive is hardcoded.

Access settings via the module-level `settings` singleton:

    from app.core.config import settings
    settings.database_url
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Database (required) ---
    database_url: str

    # --- OpenAI (required) ---
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"

    # --- PayFast (public sandbox defaults; override in prod) ---
    payfast_merchant_id: str = "10000100"
    payfast_merchant_key: str = "46f0cd694581a"
    payfast_passphrase: str = ""
    payfast_process_url: str = "https://sandbox.payfast.co.za/eng/process"
    payfast_confirmation_email: str = ""

    # --- Public URLs ---
    base_url: str = "https://linkmate.fly.dev"

    # --- CORS ---
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://linkmate.fly.dev",
    ]

    # --- JWT settings ---
    jwt_secret_key: str = "supersecretkeychangeinproduction"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    # --- Google OAuth ---
    google_client_id: str = ""
    google_client_secret: str = ""

    # --- LinkedIn OAuth ---
    linkedin_client_id: str = ""
    linkedin_client_secret: str = ""

    # --- OAuth Redirect ---
    oauth_redirect_url: str = "http://localhost:5173/auth/callback"


@lru_cache
def get_settings() -> Settings:
    """Return the cached settings singleton."""
    return Settings()


settings = get_settings()

