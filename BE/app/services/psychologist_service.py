from supabase import Client

from app.core.errors import not_found, run


# --- psychologists ---------------------------------------------------------

def list_psychologists(
    client: Client, kota: str | None, spesialisasi: str | None, limit: int, offset: int
) -> list[dict]:
    query = client.table("psychologists").select("*").order("nama_profesional")
    if kota:
        query = query.eq("kota", kota)
    if spesialisasi:
        query = query.ilike("spesialisasi", f"%{spesialisasi}%")
    return run(query.range(offset, offset + limit - 1)).data


def get_psychologist(client: Client, psychologist_id: str) -> dict:
    result = run(
        client.table("psychologists")
        .select("*")
        .eq("id_psychologist", psychologist_id)
        .maybe_single()
    )
    if not result.data:
        raise not_found("Psikolog tidak ditemukan")
    return result.data


def get_own_psychologist(client: Client, user_id: str) -> dict:
    result = run(
        client.table("psychologists").select("*").eq("id_user", user_id).maybe_single()
    )
    if not result.data:
        raise not_found("Kamu belum terdaftar sebagai psikolog")
    return result.data


def register_psychologist(client: Client, user_id: str, payload: dict) -> dict:
    body = {**payload, "id_user": user_id}
    return run(client.table("psychologists").insert(body).select("*")).data[0]


def update_own_psychologist(client: Client, user_id: str, payload: dict) -> dict:
    if not payload:
        return get_own_psychologist(client, user_id)
    result = run(
        client.table("psychologists").update(payload).eq("id_user", user_id).select("*")
    )
    if not result.data:
        raise not_found("Kamu belum terdaftar sebagai psikolog")
    return result.data[0]


def set_verification(client: Client, psychologist_id: str, verification_status: str) -> dict:
    result = run(
        client.table("psychologists")
        .update({"verification_status": verification_status})
        .eq("id_psychologist", psychologist_id)
        .select("*")
    )
    if not result.data:
        raise not_found("Psikolog tidak ditemukan")
    return result.data[0]


# --- schedules ---------------------------------------------------------

def list_schedules(client: Client, psychologist_id: str, active_only: bool) -> list[dict]:
    query = (
        client.table("psychologist_schedules")
        .select("*")
        .eq("id_psychologist", psychologist_id)
        .order("hari")
    )
    if active_only:
        query = query.eq("is_active", True)
    return run(query).data


def create_schedule(client: Client, psychologist_id: str, payload: dict) -> dict:
    body = {**payload, "id_psychologist": psychologist_id}
    return run(client.table("psychologist_schedules").insert(body).select("*")).data[0]


def update_schedule(
    client: Client, psychologist_id: str, schedule_id: str, payload: dict
) -> dict:
    result = run(
        client.table("psychologist_schedules")
        .update(payload)
        .eq("id_schedule", schedule_id)
        .eq("id_psychologist", psychologist_id)
        .select("*")
    )
    if not result.data:
        raise not_found("Jadwal tidak ditemukan")
    return result.data[0]


def delete_schedule(client: Client, psychologist_id: str, schedule_id: str) -> None:
    result = run(
        client.table("psychologist_schedules")
        .delete()
        .eq("id_schedule", schedule_id)
        .eq("id_psychologist", psychologist_id)
        .select("id_schedule")
    )
    if not result.data:
        raise not_found("Jadwal tidak ditemukan")


# --- appointments ---------------------------------------------------------

def list_appointments_for_user(client: Client, limit: int, offset: int) -> list[dict]:
    result = run(
        client.table("psychologist_appointments")
        .select("*")
        .order("tanggal_mulai", desc=True)
        .range(offset, offset + limit - 1)
    )
    return result.data


def get_appointment(client: Client, appointment_id: str) -> dict:
    result = run(
        client.table("psychologist_appointments")
        .select("*")
        .eq("id_appointment", appointment_id)
        .maybe_single()
    )
    if not result.data:
        raise not_found("Appointment tidak ditemukan")
    return result.data


def create_appointment(client: Client, user_id: str, payload: dict) -> dict:
    body = {**payload, "id_user": user_id}
    return run(client.table("psychologist_appointments").insert(body).select("*")).data[0]


def update_appointment(client: Client, appointment_id: str, payload: dict) -> dict:
    result = run(
        client.table("psychologist_appointments")
        .update(payload)
        .eq("id_appointment", appointment_id)
        .select("*")
    )
    if not result.data:
        raise not_found("Appointment tidak ditemukan")
    return result.data[0]
