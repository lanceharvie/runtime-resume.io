from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


PIPELINE_API_DIR = Path(__file__).resolve().parents[1]


def default_database_url() -> str:
    return f"sqlite:///{PIPELINE_API_DIR / 'pipeline.db'}"


def default_resume_storage_root() -> str:
    return str(PIPELINE_API_DIR / "storage" / "resumes")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(PIPELINE_API_DIR / ".env"),
        env_prefix="PIPELINE_",
        extra="ignore",
    )

    app_name: str = "RunTime Resume Pipeline API"
    environment: str = "development"
    base_url: str = "http://localhost:8000"
    frontend_base_url: str = "http://localhost:3000"
    database_url: str = Field(default_factory=default_database_url)
    resume_storage_root: str = Field(default_factory=default_resume_storage_root)
    auto_create_schema: bool = False
    aws_region: str = Field(
        default="ap-southeast-2",
        validation_alias=AliasChoices("PIPELINE_AWS_REGION", "AWS_REGION"),
    )
    ses_from_email: str = Field(
        default="",
        validation_alias=AliasChoices("PIPELINE_SES_FROM_EMAIL", "SES_FROM_EMAIL"),
    )
    ses_reply_to: str = Field(
        default="",
        validation_alias=AliasChoices("PIPELINE_SES_REPLY_TO", "SES_REPLY_TO"),
    )
    ses_smtp_host: str = Field(
        default="",
        validation_alias=AliasChoices("PIPELINE_SES_SMTP_HOST", "SES_SMTP_HOST"),
    )
    ses_smtp_port: int = Field(
        default=587,
        validation_alias=AliasChoices("PIPELINE_SES_SMTP_PORT", "SES_SMTP_PORT"),
    )
    ses_smtp_username: str = Field(
        default="",
        validation_alias=AliasChoices("PIPELINE_SES_SMTP_USERNAME", "SES_SMTP_USERNAME", "SES_USERNAME"),
    )
    ses_smtp_password: str = Field(
        default="",
        validation_alias=AliasChoices("PIPELINE_SES_SMTP_PASSWORD", "SES_SMTP_PASSWORD", "SES_PASSWORD"),
    )
    stripe_secret_key: str = Field(
        default="",
        validation_alias=AliasChoices("PIPELINE_STRIPE_SECRET_KEY", "STRIPE_SECRET_KEY"),
    )
    stripe_webhook_secret: str = Field(
        default="",
        validation_alias=AliasChoices("PIPELINE_STRIPE_WEBHOOK_SECRET", "STRIPE_WEBHOOK_SECRET"),
    )
    internal_api_key: str = ""
    magic_link_expiry_minutes: int = 15
    dashboard_session_ttl_minutes: int = 120
    notification_rate_limit_days: int = 7
    match_threshold: float = 0.78
    role_match_feed_path: str = ""
    role_match_jobboard_db_path: str = ""
    role_match_max_candidates_per_job: int = 25
    share_prompt_delay_hours: int = 24
    refresh_offer_min_days: int = 335
    refresh_offer_max_days: int = 337
    placed_followup_feed_path: str = ""
    opencats_db_host: str = Field(
        default="",
        validation_alias=AliasChoices("PIPELINE_CATS_DB_HOST", "PIPELINE_OPENCATS_DB_HOST", "CATS_DB_HOST", "OPENCATS_DB_HOST"),
    )
    opencats_db_port: int = Field(
        default=3306,
        validation_alias=AliasChoices("PIPELINE_CATS_DB_PORT", "PIPELINE_OPENCATS_DB_PORT", "CATS_DB_PORT", "OPENCATS_DB_PORT"),
    )
    opencats_db_user: str = Field(
        default="",
        validation_alias=AliasChoices("PIPELINE_CATS_DB_USER", "PIPELINE_OPENCATS_DB_USER", "CATS_DB_USER", "OPENCATS_DB_USER"),
    )
    opencats_db_password: str = Field(
        default="",
        validation_alias=AliasChoices(
            "PIPELINE_CATS_DB_PASS",
            "PIPELINE_OPENCATS_DB_PASS",
            "PIPELINE_OPENCATS_DB_PASSWORD",
            "CATS_DB_PASS",
            "OPENCATS_DB_PASS",
            "OPENCATS_DB_PASSWORD",
        ),
    )
    opencats_db_name: str = Field(
        default="",
        validation_alias=AliasChoices("PIPELINE_CATS_DB_NAME", "PIPELINE_OPENCATS_DB_NAME", "CATS_DB_NAME", "OPENCATS_DB_NAME"),
    )
    opencats_site_id: int = Field(
        default=1,
        validation_alias=AliasChoices("PIPELINE_CATS_SITE_ID", "PIPELINE_OPENCATS_SITE_ID", "CATS_SITE_ID", "OPENCATS_SITE_ID"),
    )
    opencats_system_user_id: int = Field(
        default=1,
        validation_alias=AliasChoices(
            "PIPELINE_ATS_SYSTEM_USER_ID",
            "PIPELINE_OPENCATS_SYSTEM_USER_ID",
            "ATS_SYSTEM_USER_ID",
            "OPENCATS_SYSTEM_USER_ID",
        ),
    )
    qdrant_host: str = Field(
        default="localhost",
        validation_alias=AliasChoices("PIPELINE_QDRANT_HOST", "QDRANT_HOST"),
    )
    qdrant_port: int = Field(
        default=6333,
        validation_alias=AliasChoices("PIPELINE_QDRANT_PORT", "QDRANT_PORT"),
    )
    qdrant_collection: str = Field(
        default="candidates",
        validation_alias=AliasChoices("PIPELINE_QDRANT_COLLECTION", "QDRANT_COLLECTION"),
    )
    qdrant_timeout_seconds: int = Field(
        default=15,
        validation_alias=AliasChoices("PIPELINE_QDRANT_TIMEOUT_SECONDS", "QDRANT_TIMEOUT_SECONDS"),
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
