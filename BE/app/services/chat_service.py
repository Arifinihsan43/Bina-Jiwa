from supabase import Client

from app.core.errors import bad_request, not_found, run
from app.core.supabase_client import get_service_client

# Percakapan selalu berpasangan user <-> psikolog dan hanya dibuat oleh sistem
# saat psikolog mengonfirmasi janji temu (lihat psychologist_service.update_appointment).

_CONVERSATION_SELECT = (
    "*, psikolog:psychologists(nama_profesional, id_user), klien:profiles(nama_lengkap)"
)


def ensure_conversation_for_appointment(appointment: dict) -> str:
    """Buat (atau pakai ulang) percakapan untuk janji temu yang dikonfirmasi.

    Dipanggil dengan service client: fungsi RPC ini tidak boleh dipanggil user
    langsung karena menerima id user/psikolog sembarang.
    """
    result = run(
        get_service_client().rpc(
            "find_or_create_conversation",
            {
                "p_id_user": appointment["id_user"],
                "p_id_psychologist": appointment["id_psychologist"],
                "p_id_appointment": appointment["id_appointment"],
            },
        )
    )
    return result.data


def list_conversations(client: Client, user_id: str, limit: int, offset: int) -> list[dict]:
    # RLS: hanya percakapan di mana user adalah klien atau psikolognya.
    conversations = run(
        client.table("conversations")
        .select(_CONVERSATION_SELECT)
        .order("updated_at", desc=True)
        .range(offset, offset + limit - 1)
    ).data
    if not conversations:
        return []

    ids = [c["id_conversation"] for c in conversations]
    messages = run(
        client.table("messages")
        .select("id_conversation, id_sender, message_type, isi, is_read, created_at")
        .in_("id_conversation", ids)
        .order("created_at", desc=True)
        .limit(1000)
    ).data

    last_by_conv: dict[str, dict] = {}
    unread_by_conv: dict[str, int] = {}
    for m in messages:
        conv_id = m["id_conversation"]
        last_by_conv.setdefault(conv_id, m)
        if not m["is_read"] and m["id_sender"] != user_id:
            unread_by_conv[conv_id] = unread_by_conv.get(conv_id, 0) + 1

    for c in conversations:
        c["pesan_terakhir"] = last_by_conv.get(c["id_conversation"])
        c["jumlah_belum_dibaca"] = unread_by_conv.get(c["id_conversation"], 0)

    # Percakapan dengan pesan terbaru di atas.
    conversations.sort(
        key=lambda c: (c["pesan_terakhir"] or {}).get("created_at") or c["updated_at"],
        reverse=True,
    )
    return conversations


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
    conversation = _assert_conversation_visible(client, conversation_id)
    if conversation["status"] != "ACTIVE":
        raise bad_request("Percakapan ini sudah ditutup")
    body = {**payload, "id_conversation": conversation_id, "id_sender": user_id}
    return run(client.table("messages").insert(body).select("*")).data[0]


def mark_conversation_read(client: Client, user_id: str, conversation_id: str) -> None:
    _assert_conversation_visible(client, conversation_id)
    run(
        client.table("messages")
        .update({"is_read": True})
        .eq("id_conversation", conversation_id)
        .neq("id_sender", user_id)
        .eq("is_read", False)
    )
