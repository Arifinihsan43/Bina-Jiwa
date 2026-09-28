from supabase import Client

from app.core.errors import forbidden, not_found, run


def list_conversations(client: Client, limit: int, offset: int) -> list[dict]:
    result = run(
        client.table("conversations")
        .select("*")
        .order("updated_at", desc=True)
        .range(offset, offset + limit - 1)
    )
    return result.data


def find_or_create_conversation(
    client: Client, user_id: str, id_psychologist: str, id_appointment: str | None
) -> dict:
    result = run(
        client.rpc(
            "find_or_create_conversation",
            {
                "p_id_user": user_id,
                "p_id_psychologist": id_psychologist,
                "p_id_appointment": id_appointment,
            },
        )
    )
    conversation_id = result.data
    detail = run(
        client.table("conversations")
        .select("*")
        .eq("id_conversation", conversation_id)
        .maybe_single()
    )
    if not detail.data:
        raise not_found("Percakapan tidak ditemukan")
    return detail.data


def _assert_conversation_visible(client: Client, conversation_id: str) -> dict:
    result = run(
        client.table("conversations")
        .select("*")
        .eq("id_conversation", conversation_id)
        .maybe_single()
    )
    if not result.data:
        raise not_found("Percakapan tidak ditemukan")
    return result.data


def list_messages(client: Client, conversation_id: str, limit: int, offset: int) -> list[dict]:
    _assert_conversation_visible(client, conversation_id)
    result = run(
        client.table("messages")
        .select("*")
        .eq("id_conversation", conversation_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
    )
    return result.data


def send_message(client: Client, user_id: str, conversation_id: str, payload: dict) -> dict:
    _assert_conversation_visible(client, conversation_id)
    body = {**payload, "id_conversation": conversation_id, "id_sender": user_id}
    return run(client.table("messages").insert(body).select("*")).data[0]


def mark_conversation_read(client: Client, user_id: str, conversation_id: str) -> None:
    _assert_conversation_visible(client, conversation_id)
    run(
        client.table("messages")
        .update({"is_read": True})
        .eq("id_conversation", conversation_id)
        .neq("id_sender", user_id)
    )
