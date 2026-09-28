from supabase import Client

from app.core.errors import not_found, run


def list_events(client: Client, upcoming_only: bool, limit: int, offset: int) -> list[dict]:
    query = client.table("events").select("*").order("tanggal_mulai")
    if upcoming_only:
        query = query.eq("status", "PUBLISHED")
    return run(query.range(offset, offset + limit - 1)).data


def get_event(client: Client, event_id: str) -> dict:
    result = run(client.table("events").select("*").eq("id_event", event_id).maybe_single())
    if not result.data:
        raise not_found("Event tidak ditemukan")
    return result.data


def create_event(client: Client, user_id: str, payload: dict) -> dict:
    body = {**payload, "id_creator": user_id}
    return run(client.table("events").insert(body).select("*")).data[0]


def update_event(client: Client, event_id: str, payload: dict) -> dict:
    result = run(client.table("events").update(payload).eq("id_event", event_id).select("*"))
    if not result.data:
        raise not_found("Event tidak ditemukan")
    return result.data[0]


def register_participant(client: Client, user_id: str, event_id: str) -> dict:
    body = {"id_event": event_id, "id_user": user_id}
    return run(client.table("event_participants").insert(body).select("*")).data[0]


def list_participants(client: Client, event_id: str, limit: int, offset: int) -> list[dict]:
    result = run(
        client.table("event_participants")
        .select("*")
        .eq("id_event", event_id)
        .order("registered_at")
        .range(offset, offset + limit - 1)
    )
    return result.data


def list_my_registrations(client: Client, limit: int, offset: int) -> list[dict]:
    result = run(
        client.table("event_participants")
        .select("*")
        .order("registered_at", desc=True)
        .range(offset, offset + limit - 1)
    )
    return result.data


def update_participant(client: Client, event_id: str, user_id: str, payload: dict) -> dict:
    result = run(
        client.table("event_participants")
        .update(payload)
        .eq("id_event", event_id)
        .eq("id_user", user_id)
        .select("*")
    )
    if not result.data:
        raise not_found("Pendaftaran tidak ditemukan")
    return result.data[0]
