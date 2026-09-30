from datetime import date

from fastapi import HTTPException, status
from supabase import Client

from app.core.errors import not_found, run
from app.core.timezone import today_wib, wib_day_bounds


def _apply_date_range(query, dari: date | None, sampai: date | None):
    # Filter berdasarkan tanggal WIB (inklusif) pada kolom created_at.
    if dari:
        query = query.gte("created_at", wib_day_bounds(dari)[0])
    if sampai:
        query = query.lt("created_at", wib_day_bounds(sampai)[1])
    return query


def list_moods(
    client: Client,
    user_id: str,
    limit: int,
    offset: int,
    dari: date | None = None,
    sampai: date | None = None,
) -> list[dict]:
    query = client.table("mood_entries").select("*").eq("id_user", user_id)
    query = _apply_date_range(query, dari, sampai)
    result = run(query.order("created_at", desc=True).range(offset, offset + limit - 1))
    return result.data


def get_mood(client: Client, user_id: str, mood_id: str) -> dict:
    result = run(
        client.table("mood_entries")
        .select("*")
        .eq("id_user", user_id)
        .eq("id_mood_entry", mood_id)
        .maybe_single()
    )
    if not result.data:
        raise not_found("Catatan mood tidak ditemukan")
    return result.data


def create_mood(client: Client, user_id: str, payload: dict) -> dict:
    # Check-in mood hanya 1 kali per hari (WIB).
    if list_moods(client, user_id, 1, 0, dari=today_wib(), sampai=today_wib()):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Kamu sudah mencatat mood hari ini. Setiap hari hanya dapat diisi 1 kali.",
        )
    body = {**payload, "id_user": user_id}
    result = run(client.table("mood_entries").insert(body).select("*"))
    return result.data[0]


def update_mood(client: Client, user_id: str, mood_id: str, payload: dict) -> dict:
    if not payload:
        return get_mood(client, user_id, mood_id)
    result = run(
        client.table("mood_entries")
        .update(payload)
        .eq("id_user", user_id)
        .eq("id_mood_entry", mood_id)
        .select("*")
    )
    if not result.data:
        raise not_found("Catatan mood tidak ditemukan")
    return result.data[0]


def delete_mood(client: Client, user_id: str, mood_id: str) -> None:
    result = run(
        client.table("mood_entries")
        .delete()
        .eq("id_user", user_id)
        .eq("id_mood_entry", mood_id)
        .select("id_mood_entry")
    )
    if not result.data:
        raise not_found("Catatan mood tidak ditemukan")


def list_journals(
    client: Client,
    user_id: str,
    limit: int,
    offset: int,
    dari: date | None = None,
    sampai: date | None = None,
) -> list[dict]:
    query = client.table("journals").select("*").eq("id_user", user_id)
    query = _apply_date_range(query, dari, sampai)
    result = run(query.order("created_at", desc=True).range(offset, offset + limit - 1))
    return result.data


def get_journal(client: Client, user_id: str, journal_id: str) -> dict:
    result = run(
        client.table("journals")
        .select("*")
        .eq("id_user", user_id)
        .eq("id_journal", journal_id)
        .maybe_single()
    )
    if not result.data:
        raise not_found("Jurnal tidak ditemukan")
    return result.data


def create_journal(client: Client, user_id: str, payload: dict) -> dict:
    body = {**payload, "id_user": user_id}
    result = run(client.table("journals").insert(body).select("*"))
    return result.data[0]


def update_journal(client: Client, user_id: str, journal_id: str, payload: dict) -> dict:
    if not payload:
        return get_journal(client, user_id, journal_id)
    result = run(
        client.table("journals")
        .update(payload)
        .eq("id_user", user_id)
        .eq("id_journal", journal_id)
        .select("*")
    )
    if not result.data:
        raise not_found("Jurnal tidak ditemukan")
    return result.data[0]


def delete_journal(client: Client, user_id: str, journal_id: str) -> None:
    result = run(
        client.table("journals")
        .delete()
        .eq("id_user", user_id)
        .eq("id_journal", journal_id)
        .select("id_journal")
    )
    if not result.data:
        raise not_found("Jurnal tidak ditemukan")
