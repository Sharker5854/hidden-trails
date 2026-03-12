from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Users Service"
    app_host: str

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