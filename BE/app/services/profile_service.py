from supabase import Client

from app.core.errors import not_found, run


def get_profile(client: Client, user_id: str) -> dict:
    result = run(client.table("profiles").select("*").eq("id_user", user_id).maybe_single())
    if not result.data:
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
