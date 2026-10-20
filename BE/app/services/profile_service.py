from supabase import Client

from app.core.config import get_settings
from app.core.errors import not_found, run
from app.core.supabase_client import get_service_client


def get_profile(client: Client, user_id: str) -> dict:
    result = run(client.table("profiles").select("*").eq("id_user", user_id).maybe_single())
    if not result.data:
        settings = get_settings()
        if settings.has_service_role:
            try:
                svc = get_service_client()
                user_res = svc.auth.admin.get_user_by_id(user_id)
                if user_res and user_res.user:
                    u = user_res.user
                    meta = u.user_metadata or {}
                    nama = (
                        meta.get("nama_lengkap")
                        or meta.get("full_name")
                        or meta.get("name")
                        or (u.email.split("@")[0] if u.email else "Pengguna Baru")
                    )
                    avatar = meta.get("avatar_url") or meta.get("picture")
                    email_prefix = (u.email.split("@")[0] if u.email else "user").replace(".", "_")[:35]
                    username = f"{email_prefix}_{user_id[:4]}"
                    created = (
                        svc.table("profiles")
                        .insert({
                            "id_user": user_id,
                            "nama_lengkap": nama[:100],
                            "username": username[:50],
                            "role": "USER",
                            "foto_profil": avatar,
                        })
                        .select("*")
                        .maybe_single()
                        .execute()
                    )
                    if created.data:
                        return created.data
            except Exception:
                pass
        raise not_found("Profil tidak ditemukan")
    return result.data


def update_profile(client: Client, user_id: str, payload: dict) -> dict:
    if not payload:
        return get_profile(client, user_id)
    result = run(
        client.table("profiles").update(payload).eq("id_user", user_id).select("*")
    )
    if not result.data:
        raise not_found("Profil tidak ditemukan")
    return result.data[0]


def get_own_persona(client: Client, user_id: str) -> dict:
    result = run(client.table("personas").select("*").eq("id_user", user_id).maybe_single())
    if not result.data:
        raise not_found("Persona belum dibuat")
    return result.data


def create_persona(client: Client, user_id: str, payload: dict) -> dict:
    body = {**payload, "id_user": user_id}
    result = run(client.table("personas").insert(body).select("*"))
    return result.data[0]


def update_persona(client: Client, user_id: str, payload: dict) -> dict:
    if not payload:
        return get_own_persona(client, user_id)
    result = run(
        client.table("personas").update(payload).eq("id_user", user_id).select("*")
    )
    if not result.data:
        raise not_found("Persona belum dibuat")
    return result.data[0]
