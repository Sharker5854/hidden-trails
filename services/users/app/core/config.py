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

    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

settings = Settings()