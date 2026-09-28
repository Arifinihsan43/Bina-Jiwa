from functools import lru_cache

from supabase import Client, create_client

from app.core.config import get_settings


@lru_cache
def get_anon_client() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


@lru_cache
def get_service_client() -> Client:
    settings = get_settings()
    if not settings.has_service_role:
        raise RuntimeError(
            "SUPABASE_SERVICE_ROLE_KEY belum diisi di .env — operasi ini butuh service role key."
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_user_client(access_token: str) -> Client:
    """Client baru yang di-scope ke JWT user, supaya semua query tunduk pada RLS sebagai user tsb."""
    settings = get_settings()
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(access_token)
    return client
