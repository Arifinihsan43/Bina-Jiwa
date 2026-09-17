from supabase import Client

from app.core.errors import not_found, run


def list_notifications(
    client: Client, user_id: str, unread_only: bool, limit: int, offset: int
) -> list[dict]:
    query = (
        client.table("notifications")
        .select("*")
        .eq("id_user", user_id)
        .order("created_at", desc=True)
    )
    if unread_only:
        query = query.eq("is_read", False)
    return run(query.range(offset, offset + limit - 1)).data


def mark_read(client: Client, user_id: str, notification_id: str) -> dict:
    result = run(
        client.table("notifications")
        .update({"is_read": True})
        .eq("id_user", user_id)
        .eq("id_notification", notification_id)
        .select("*")
    )
    if not result.data:
        raise not_found("Notifikasi tidak ditemukan")
    return result.data[0]


def mark_all_read(client: Client, user_id: str) -> None:
    run(
        client.table("notifications")
        .update({"is_read": True})
        .eq("id_user", user_id)
        .eq("is_read", False)
    )
