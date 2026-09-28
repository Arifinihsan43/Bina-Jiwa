from supabase import Client

from app.core.errors import not_found, run


def list_contacts(client: Client, active_only: bool) -> list[dict]:
    query = client.table("emergency_contacts").select("*").order("nama")
    if active_only:
        query = query.eq("is_active", True)
    return run(query).data


def create_contact(client: Client, payload: dict) -> dict:
    return run(client.table("emergency_contacts").insert(payload).select("*")).data[0]


def update_contact(client: Client, contact_id: str, payload: dict) -> dict:
    result = run(
        client.table("emergency_contacts")
        .update(payload)
        .eq("id_emergency_contact", contact_id)
        .select("*")
    )
    if not result.data:
        raise not_found("Kontak darurat tidak ditemukan")
    return result.data[0]


def delete_contact(client: Client, contact_id: str) -> None:
    result = run(
        client.table("emergency_contacts")
        .delete()
        .eq("id_emergency_contact", contact_id)
        .select("id_emergency_contact")
    )
    if not result.data:
        raise not_found("Kontak darurat tidak ditemukan")
