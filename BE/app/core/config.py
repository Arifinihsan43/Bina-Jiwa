from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str | None = None
    supabase_jwt_secret: str | None = None
    cors_origins: str = "*"
    admin_access_key: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def has_service_role(self) -> bool:
        return bool(self.supabase_service_role_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
