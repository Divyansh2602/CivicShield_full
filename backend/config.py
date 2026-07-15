# ===================================================
# CivicShield AI — Application Settings
# Central, env-driven configuration (12-factor).
# ===================================================
from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Core ---
    app_name: str = "CivicShield AI"
    environment: str = Field(default="development")  # development | production
    debug: bool = Field(default=False)

    # --- Security ---
    # MUST be overridden in production via env. A weak default is tolerated only
    # in development; startup will warn loudly (see main.lifespan).
    secret_key: str = Field(default="dev-insecure-change-me")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # --- Database ---
    database_url: str = Field(default="sqlite:///./civicshield.db")

    # --- CORS ---
    # Comma-separated list in the env, e.g.
    # CORS_ORIGINS="http://localhost:3000,https://civicshield.vercel.app"
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"]
    )

    # --- Scanner safety / limits ---
    # When False (default), the scanner refuses targets that resolve to private,
    # loopback, link-local or otherwise-reserved IPs (SSRF protection).
    # Set True only for scanning your own local apps in development.
    allow_private_targets: bool = Field(default=False)
    scan_max_pages: int = Field(default=3)
    scan_request_timeout: float = Field(default=4.0)
    max_target_length: int = Field(default=2048)

    # --- Rate limiting (slowapi syntax) ---
    rate_limit_scan: str = "10/minute"
    rate_limit_phishing: str = "30/minute"
    rate_limit_auth: str = "5/minute"

    # --- Cold-start keep-warm ---
    # If set to the public base URL of this API, an internal task pings
    # {keep_warm_url}/health on an interval to reduce cold starts.
    keep_warm_url: str = Field(default="")
    keep_warm_interval_seconds: int = Field(default=600)

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
