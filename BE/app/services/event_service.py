from datetime import datetime, timezone

from fastapi import HTTPException, status
from supabase import Client

from app.core.errors import bad_request, not_found, run
from app.core.supabase_client import get_service_client

# Alur: fasilitator/komunitas mengirim proposal lewat email, admin yang membuat &
# mempublikasikan event lewat Panel Admin (service client). Pengguna hanya melihat
# event PUBLISHED dan mendaftar.

ACTIVE_PARTICIPANT = ("REGISTERED", "ATTENDED")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse(ts: str | None) -> datetime | None:
    return datetime.fromisoformat(ts) if ts else None


def _registration_deadline(event: dict) -> datetime:
    return _parse(event.get("batas_pendaftaran")) or _parse(event["tanggal_mulai"])


def _participant_counts(event_ids: list[str]) -> dict[str, int]:
    # RLS hanya menampilkan pendaftaran milik sendiri, jadi jumlah peserta dihitung
    # dengan service client (hanya angka, tanpa identitas peserta).
    if not event_ids:
        return {}
    rows = run(
        get_service_client()
        .table("event_participants")
        .select("id_event")
        .in_("id_event", event_ids)
        .in_("status", list(ACTIVE_PARTICIPANT))
    ).data
    counts: dict[str, int] = {}
    for r in rows:
        counts[r["id_event"]] = counts.get(r["id_event"], 0) + 1
    return counts


def _shape(events: list[dict], my_status: dict[str, str], *, show_links: bool) -> list[dict]:
    counts = _participant_counts([e["id_event"] for e in events])
    now = _now()
    for e in events:
        e.pop("id_creator", None)
        nama = e.pop("penyelenggara", None)
        info = e.pop("penyelenggara_info", None)
        e["penyelenggara"] = {"nama": nama, "keterangan": info} if nama else None
        e["jumlah_peserta"] = counts.get(e["id_event"], 0)
        e["sisa_kursi"] = None if e["kapasitas"] is None else max(0, e["kapasitas"] - e["jumlah_peserta"])
        e["status_pendaftaran_saya"] = my_status.get(e["id_event"])
        e["pendaftaran_dibuka"] = (
            e["status"] == "PUBLISHED"
            and now < _registration_deadline(e)
            and (e["sisa_kursi"] is None or e["sisa_kursi"] > 0)
        )
        # Tautan meeting hanya untuk peserta aktif (atau admin).
        if not show_links and e["status_pendaftaran_saya"] not in ACTIVE_PARTICIPANT:
            e["link_meeting"] = None
    return events


def _enrich_for_user(client: Client, user_id: str, events: list[dict]) -> list[dict]:
    if not events:
        return []
    mine = {
        r["id_event"]: r["status"]
        for r in run(
            client.table("event_participants")
            .select("id_event, status")
            .eq("id_user", user_id)
            .in_("id_event", [e["id_event"] for e in events])
        ).data
    }
    return _shape(events, mine, show_links=False)


# --- pengguna ----------------------------------------------------------------

def list_events(client: Client, user_id: str, upcoming_only: bool, limit: int, offset: int) -> list[dict]:
    query = client.table("events").select("*").eq("status", "PUBLISHED").order("tanggal_mulai")
    if upcoming_only:
        query = query.gte("tanggal_selesai", _now().isoformat())
    return _enrich_for_user(client, user_id, run(query.range(offset, offset + limit - 1)).data)


def _get_event_row(client: Client, event_id: str) -> dict:
    result = run(client.table("events").select("*").eq("id_event", event_id).maybe_single())
    if not result.data:
        raise not_found("Event tidak ditemukan")
    return result.data


def get_event(client: Client, user_id: str, event_id: str) -> dict:
    return _enrich_for_user(client, user_id, [_get_event_row(client, event_id)])[0]


def register_participant(client: Client, user_id: str, event_id: str) -> dict:
    event = get_event(client, user_id, event_id)
    if event["status_pendaftaran_saya"] in ACTIVE_PARTICIPANT:
        raise HTTPException(status.HTTP_409_CONFLICT, "Kamu sudah terdaftar di event ini")
    if not event["pendaftaran_dibuka"]:
        if event["sisa_kursi"] == 0:
            raise HTTPException(status.HTTP_409_CONFLICT, "Maaf, kursi untuk event ini sudah penuh")
        raise bad_request("Pendaftaran event ini sudah ditutup")
    if event["harga"] > 0:
        # Event berbayar: peserta terdaftar otomatis setelah pembayaran lunas (lihat /payments).
        raise bad_request("Event berbayar, selesaikan pembayaran untuk mendaftar")

    if event["status_pendaftaran_saya"] == "CANCELLED":
        # Pernah daftar lalu batal: aktifkan lagi baris yang sama (primary key id_event + id_user).
        run(
            client.table("event_participants")
            .update({"status": "REGISTERED", "registered_at": _now().isoformat()})
            .eq("id_event", event_id)
            .eq("id_user", user_id)
        )
    else:
        run(client.table("event_participants").insert({"id_event": event_id, "id_user": user_id}))
    return get_event(client, user_id, event_id)


def cancel_my_registration(client: Client, user_id: str, event_id: str) -> dict:
    event = get_event(client, user_id, event_id)
    if event["status_pendaftaran_saya"] != "REGISTERED":
        raise bad_request("Kamu tidak memiliki pendaftaran aktif di event ini")
    if _parse(event["tanggal_mulai"]) <= _now():
        raise bad_request("Event sudah dimulai, pendaftaran tidak dapat dibatalkan")
    run(
        client.table("event_participants")
        .update({"status": "CANCELLED"})
        .eq("id_event", event_id)
        .eq("id_user", user_id)
    )
    return get_event(client, user_id, event_id)


def list_my_registrations(client: Client, user_id: str) -> list[dict]:
    """Event yang pernah didaftari user (termasuk yang kemudian dibatalkan admin)."""
    regs = run(
        client.table("event_participants")
        .select("id_event, status")
        .eq("id_user", user_id)
        .order("registered_at", desc=True)
    ).data
    if not regs:
        return []
    # Event yang dibatalkan tidak terlihat lewat RLS, padahal user terdaftar di dalamnya.
    events = run(
        get_service_client().table("events").select("*").in_("id_event", [r["id_event"] for r in regs])
    ).data
    order = {r["id_event"]: i for i, r in enumerate(regs)}
    events.sort(key=lambda e: order[e["id_event"]])
    return _shape(events, {r["id_event"]: r["status"] for r in regs}, show_links=False)


# --- admin (service client) ----------------------------------------------------

def _validate_schedule(data: dict, is_new: bool) -> None:
    start, end = _parse(data["tanggal_mulai"]), _parse(data["tanggal_selesai"])
    deadline = _parse(data.get("batas_pendaftaran"))
    if any(t is not None and t.tzinfo is None for t in (start, end, deadline)):
        raise bad_request("Waktu harus menyertakan zona waktu")
    if end <= start:
        raise bad_request("Waktu selesai harus setelah waktu mulai")
    if is_new and start <= _now():
        raise bad_request("Waktu mulai harus di masa depan")
    if deadline and deadline > start:
        raise bad_request("Batas pendaftaran tidak boleh setelah event dimulai")
    if data["type"] == "OFFLINE" and not (data.get("lokasi") or "").strip():
        raise bad_request("Lokasi wajib diisi untuk event tatap muka")


def admin_list_events(service: Client) -> list[dict]:
    rows = run(service.table("events").select("*").order("tanggal_mulai", desc=True)).data
    return _shape(rows, {}, show_links=True)


def admin_get_event(service: Client, event_id: str) -> dict:
    return _shape([_get_event_row(service, event_id)], {}, show_links=True)[0]


def admin_create_event(service: Client, payload: dict) -> dict:
    _validate_schedule(payload, is_new=True)
    created = run(service.table("events").insert(payload).select("id_event")).data[0]
    return admin_get_event(service, created["id_event"])


_ALLOWED_EVENT_STATUS = {
    "DRAFT": {"PUBLISHED", "CANCELLED"},
    "PUBLISHED": {"DRAFT", "CANCELLED", "COMPLETED"},
}


def admin_update_event(service: Client, event_id: str, payload: dict) -> dict:
    event = _get_event_row(service, event_id)
    if event["status"] in ("CANCELLED", "COMPLETED"):
        raise bad_request("Event yang sudah dibatalkan atau selesai tidak dapat diubah")

    new_status = payload.get("status")
    if new_status and new_status != event["status"]:
        if new_status not in _ALLOWED_EVENT_STATUS.get(event["status"], set()):
            raise bad_request("Perubahan status event tidak diizinkan")
        if new_status == "COMPLETED" and _parse(event["tanggal_mulai"]) > _now():
            raise bad_request("Event belum dimulai, belum bisa ditandai selesai")

    merged = {**event, **payload}
    if any(k in payload for k in ("tanggal_mulai", "tanggal_selesai", "batas_pendaftaran", "type", "lokasi")):
        _validate_schedule(merged, is_new=False)
    if payload.get("kapasitas") is not None:
        registered = _participant_counts([event_id]).get(event_id, 0)
        if payload["kapasitas"] < registered:
            raise bad_request(f"Kapasitas tidak boleh kurang dari jumlah peserta terdaftar ({registered})")

    if payload:
        run(service.table("events").update(payload).eq("id_event", event_id))
    return admin_get_event(service, event_id)


def _emails(service: Client, user_ids: list[str]) -> dict[str, str | None]:
    """Email peserta (dari Supabase Auth) supaya admin bisa mengirim info sesi."""
    emails: dict[str, str | None] = {}
    for uid in user_ids:
        try:
            emails[uid] = service.auth.admin.get_user_by_id(uid).user.email
        except Exception:
            emails[uid] = None
    return emails


def admin_list_participants(service: Client, event_id: str) -> list[dict]:
    _get_event_row(service, event_id)
    rows = run(
        service.table("event_participants")
        .select("id_user, status, registered_at, attended_at, profil:profiles(nama_lengkap)")
        .eq("id_event", event_id)
        .order("registered_at")
    ).data
    emails = _emails(service, [r["id_user"] for r in rows])
    for r in rows:
        r["nama_lengkap"] = (r.pop("profil") or {}).get("nama_lengkap") or "Peserta"
        r["email"] = emails.get(r["id_user"])
    return rows


def admin_set_attendance(service: Client, event_id: str, participant_id: str, attended: bool) -> dict:
    event = _get_event_row(service, event_id)
    if _parse(event["tanggal_mulai"]) > _now():
        raise bad_request("Kehadiran baru bisa ditandai setelah event dimulai")
    body = (
        {"status": "ATTENDED", "attended_at": _now().isoformat()}
        if attended
        else {"status": "REGISTERED", "attended_at": None}
    )
    result = run(
        service.table("event_participants")
        .update(body)
        .eq("id_event", event_id)
        .eq("id_user", participant_id)
        .in_("status", list(ACTIVE_PARTICIPANT))
        .select("id_user")
    )
    if not result.data:
        raise not_found("Peserta tidak ditemukan")
    return next(p for p in admin_list_participants(service, event_id) if p["id_user"] == participant_id)
