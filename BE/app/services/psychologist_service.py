import logging
from datetime import date, datetime, time, timedelta, timezone

from fastapi import HTTPException
from supabase import Client

from app.core.errors import bad_request, forbidden, not_found, run
from app.core.supabase_client import get_service_client
from app.core.timezone import WIB, wib_day_bounds
from app.schemas.psychologist import AppointmentCreate
from app.services import chat_service


# --- psychologists ---------------------------------------------------------

_PUBLIC_SELECT = "*, psychologist_schedules(*)"


def _with_active_schedules(row: dict) -> dict:
    schedules = row.pop("psychologist_schedules", None) or []
    row["jadwal"] = sorted(
        (s for s in schedules if s.get("is_active")),
        key=lambda s: (s["hari"], s["jam_mulai"]),
    )
    return row


def list_psychologists(
    client: Client, kota: str | None, spesialisasi: str | None, limit: int, offset: int
) -> list[dict]:
    # Hanya psikolog yang sudah dipublikasikan: diverifikasi admin dan status ACTIVE.
    query = (
        client.table("psychologists")
        .select(_PUBLIC_SELECT)
        .eq("verification_status", "VERIFIED")
        .eq("status", "ACTIVE")
        .order("nama_profesional")
    )
    if kota:
        query = query.ilike("kota", kota)
    if spesialisasi:
        query = query.ilike("spesialisasi", f"%{spesialisasi}%")
    rows = run(query.range(offset, offset + limit - 1)).data
    return [_with_active_schedules(row) for row in rows]


def get_psychologist(client: Client, psychologist_id: str) -> dict:
    result = run(
        client.table("psychologists")
        .select(_PUBLIC_SELECT)
        .eq("id_psychologist", psychologist_id)
        .maybe_single()
    )
    if not result.data:
        raise not_found("Psikolog tidak ditemukan")
    return _with_active_schedules(result.data)


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


def list_for_admin(
    client: Client, verification_status: str | None, limit: int, offset: int
) -> list[dict]:
    # RLS mengizinkan admin melihat semua psikolog (termasuk PENDING/REJECTED).
    query = client.table("psychologists").select("*").order("updated_at", desc=True)
    if verification_status:
        query = query.eq("verification_status", verification_status)
    return run(query.range(offset, offset + limit - 1)).data


def set_verification(
    client: Client, psychologist_id: str, verification_status: str, catatan: str | None
) -> dict:
    catatan_verifikasi = catatan.strip() if verification_status == "REJECTED" and catatan else None
    result = run(
        client.table("psychologists")
        .update({"verification_status": verification_status, "catatan_verifikasi": catatan_verifikasi})
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

# Jadwal praktik disimpan sebagai jam lokal tanpa zona waktu; diasumsikan WIB.
MAX_SESSION = timedelta(hours=3)
ACTIVE_APPOINTMENT_STATUSES = ("PENDING", "CONFIRMED")

_APPOINTMENT_SELECT = (
    "*, psikolog:psychologists(nama_profesional, kota, alamat_praktik), "
    "klien:profiles(nama_lengkap, username)"
)

# Transisi status yang diizinkan per peran.
_CLIENT_TRANSITIONS = {"PENDING": {"CANCELLED"}, "CONFIRMED": {"CANCELLED"}}
_PSYCHOLOGIST_TRANSITIONS = {
    "PENDING": {"CONFIRMED", "CANCELLED"},
    "CONFIRMED": {"COMPLETED", "CANCELLED"},
}


def _get_appointment_row(client: Client, appointment_id: str) -> dict:
    result = run(
        client.table("psychologist_appointments")
        .select(_APPOINTMENT_SELECT)
        .eq("id_appointment", appointment_id)
        .maybe_single()
    )
    if not result.data:
        raise not_found("Janji temu tidak ditemukan")
    return result.data


def list_appointments_for_user(client: Client, limit: int, offset: int) -> list[dict]:
    # RLS: user melihat janji temu miliknya; psikolog melihat janji temu kliennya.
    result = run(
        client.table("psychologist_appointments")
        .select(_APPOINTMENT_SELECT)
        .order("tanggal_mulai", desc=True)
        .range(offset, offset + limit - 1)
    )
    return result.data


def get_appointment(client: Client, appointment_id: str) -> dict:
    return _get_appointment_row(client, appointment_id)


def list_busy_slots(psychologist_id: str, tanggal: date) -> list[dict]:
    """Rentang waktu yang sudah terisi pada satu hari (WIB), tanpa data pemesan.

    Pakai service client karena RLS menyembunyikan janji temu user lain,
    padahal pemesan perlu tahu jam mana yang sudah terisi.
    """
    day_start, day_end = wib_day_bounds(tanggal)
    result = run(
        get_service_client()
        .table("psychologist_appointments")
        .select("tanggal_mulai, tanggal_selesai")
        .eq("id_psychologist", psychologist_id)
        .in_("status", list(ACTIVE_APPOINTMENT_STATUSES))
        .lt("tanggal_mulai", day_end)
        .gt("tanggal_selesai", day_start)
        .order("tanggal_mulai")
    )
    return result.data


def _ensure_within_schedule(client: Client, psychologist_id: str, start: datetime, end: datetime) -> None:
    start_local, end_local = start.astimezone(WIB), end.astimezone(WIB)
    if start_local.date() != end_local.date():
        raise bad_request("Sesi harus dimulai dan selesai di hari yang sama")

    schedules = list_schedules(client, psychologist_id, active_only=True)
    hari = start_local.isoweekday()  # 1 = Senin ... 7 = Minggu
    for s in schedules:
        if s["hari"] != hari:
            continue
        jam_mulai = time.fromisoformat(s["jam_mulai"])
        jam_selesai = time.fromisoformat(s["jam_selesai"])
        if jam_mulai <= start_local.time() and end_local.time() <= jam_selesai:
            return
    raise bad_request("Waktu yang dipilih di luar jadwal praktik psikolog")


def create_appointment(client: Client, user_id: str, payload: AppointmentCreate) -> dict:
    # get_psychologist lewat client user: RLS hanya mengembalikan psikolog VERIFIED (atau milik sendiri).
    psychologist = get_psychologist(client, payload.id_psychologist)
    if psychologist["verification_status"] != "VERIFIED" or psychologist["status"] != "ACTIVE":
        raise bad_request("Psikolog ini sedang tidak menerima janji temu")
    if psychologist["id_user"] == user_id:
        raise bad_request("Tidak dapat membuat janji temu dengan diri sendiri")

    start, end = payload.tanggal_mulai, payload.tanggal_selesai
    if start.tzinfo is None or end.tzinfo is None:
        raise bad_request("Waktu harus menyertakan zona waktu")
    if end <= start:
        raise bad_request("Waktu selesai harus setelah waktu mulai")
    if end - start > MAX_SESSION:
        raise bad_request("Durasi sesi maksimal 3 jam")
    if start <= datetime.now(timezone.utc):
        raise bad_request("Waktu sesi sudah lewat, pilih waktu lain")
    _ensure_within_schedule(client, payload.id_psychologist, start, end)

    if payload.type == "OFFLINE":
        if not psychologist.get("alamat_praktik"):
            raise bad_request("Psikolog ini belum menyediakan sesi tatap muka")
        lokasi = ", ".join(filter(None, [psychologist["alamat_praktik"], psychologist.get("kota")]))
    else:
        lokasi = "Sesi online — tautan dikirim psikolog setelah dikonfirmasi"

    body = {
        "id_user": user_id,
        "id_psychologist": payload.id_psychologist,
        "tanggal_mulai": start.isoformat(),
        "tanggal_selesai": end.isoformat(),
        "type": payload.type,
        "lokasi": lokasi,
        "catatan": (payload.catatan or "").strip() or None,
    }
    try:
        created = run(client.table("psychologist_appointments").insert(body).select("id_appointment")).data[0]
    except HTTPException as exc:
        if exc.status_code == 409:
            raise HTTPException(409, "Jam ini sudah dipesan. Silakan pilih jam lain.") from exc
        raise
    return _get_appointment_row(client, created["id_appointment"])


def update_appointment(client: Client, user_id: str, appointment_id: str, payload: dict) -> dict:
    appointment = _get_appointment_row(client, appointment_id)
    is_client = appointment["id_user"] == user_id
    own = run(
        client.table("psychologists").select("id_psychologist").eq("id_user", user_id).maybe_single()
    ).data
    is_psychologist = bool(own) and own["id_psychologist"] == appointment["id_psychologist"]

    body: dict = {}

    new_status = payload.get("status")
    if new_status and new_status != appointment["status"]:
        allowed = set()
        if is_client:
            allowed |= _CLIENT_TRANSITIONS.get(appointment["status"], set())
        if is_psychologist:
            allowed |= _PSYCHOLOGIST_TRANSITIONS.get(appointment["status"], set())
        if new_status not in allowed:
            raise forbidden("Perubahan status janji temu ini tidak diizinkan")
        body["status"] = new_status

    if "catatan" in payload:
        if not is_client or appointment["status"] != "PENDING":
            raise forbidden("Catatan hanya bisa diubah pemesan selama menunggu konfirmasi")
        body["catatan"] = payload["catatan"]

    if "lokasi" in payload:
        if not is_psychologist:
            raise forbidden("Hanya psikolog yang dapat mengubah lokasi / tautan sesi")
        body["lokasi"] = payload["lokasi"]

    if not body:
        return appointment

    run(
        client.table("psychologist_appointments")
        .update(body)
        .eq("id_appointment", appointment_id)
    )

    # Setelah dikonfirmasi, buka ruang percakapan user <-> psikolog.
    if body.get("status") == "CONFIRMED":
        try:
            chat_service.ensure_conversation_for_appointment(appointment)
        except Exception:
            logging.getLogger(__name__).warning(
                "Gagal membuat percakapan untuk appointment %s", appointment_id, exc_info=True
            )

    return _get_appointment_row(client, appointment_id)
