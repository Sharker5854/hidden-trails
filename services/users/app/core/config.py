import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import DirectoryPath


class Settings(BaseSettings):
    app_name: str = "Users Service"
    app_host: str
    base_dir: DirectoryPath = Path(__file__).resolve().parents[1]

    log_level: str
    secret_key: str
    database_url: str
    debug: bool

    # Auth
    algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int

    # Integrations | Yandex
    yandex_cloud_api_key: str
    yandex_cloud_folder_id: str

    # Integrations | Resend
    resend_api_key: str
    reset_token_secret: str
    reset_token_expire_minutes: int

    # Integrations | Geoapify
    geoapify_api_key: str

    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

settings = Settings()