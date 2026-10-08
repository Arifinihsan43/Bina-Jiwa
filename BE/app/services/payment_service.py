import logging
import secrets
from datetime import datetime, timedelta, timezone
from decimal import ROUND_HALF_UP, Decimal

from fastapi import HTTPException, status
from supabase import Client

from app.core.config import get_settings
from app.core.errors import bad_request, forbidden, not_found, run
from app.core.supabase_client import get_service_client

# Pembayaran SIMULASI — tanpa payment gateway. Backend menghitung biaya dan membuat
# tagihan (service client, karena RLS hanya mengizinkan user membaca). Endpoint
# "simulate-paid" berperan sebagai webhook gateway: memanggil confirm_payment() di
# database yang menandai PAID dan (untuk event) mendaftarkan peserta secara atomik.
# Pembatalan janji temu / pendaftaran / event menutup tagihan lewat trigger database.

_SELECT = (
    "*, event:events(judul, tanggal_mulai, tanggal_selesai), "
    "appointment:psychologist_appointments(tanggal_mulai, tanggal_selesai, "
    "psikolog:psychologists(nama_profesional))"
)

_KODE_PREFIX = {
    "VA_BCA": "88010",
    "VA_BNI": "98820",
    "VA_MANDIRI": "89608",
    "GOPAY": "GPY",
    "OVO": "OVO",
    "DANA": "DNA",
}

_RUPIAH = Decimal("1")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse(ts: str) -> datetime:
    return datetime.fromisoformat(ts)


def expire_stale_payments() -> None:
    """Tagihan lewat batas -> EXPIRED (janji temu yang belum dibayar ikut dibatalkan)."""
    try:
        run(get_service_client().rpc("expire_payments", {}))
    except Exception:
        logging.getLogger(__name__).warning("Gagal menjalankan expire_payments", exc_info=True)


def _kode_bayar(metode: str) -> str:
    if metode == "QRIS":
        return f"QRIS-{secrets.token_hex(8).upper()}"
    prefix = _KODE_PREFIX[metode]
    if metode.startswith("VA_"):
        # Nomor VA: prefix bank + 11 digit acak.
        return prefix + "".join(secrets.choice("0123456789") for _ in range(11))
    return f"{prefix}-{secrets.token_hex(6).upper()}"


def _shape(row: dict) -> dict:
    event = row.pop("event", None)
    appointment = row.pop("appointment", None)
    if event:
        row["tujuan"] = event
    elif appointment:
        psikolog = (appointment.pop("psikolog", None) or {}).get("nama_profesional") or "Psikolog"
        row["tujuan"] = {**appointment, "judul": f"Sesi konsultasi dengan {psikolog}"}
    else:
        row["tujuan"] = None
    return row


# --- target pembayaran ---------------------------------------------------------

def _appointment_target(client: Client, user_id: str, appointment_id: str) -> dict:
    """Janji temu milik user yang masih menunggu pembayaran -> harga & info."""
    result = run(
        client.table("psychologist_appointments")
        .select("id_user, status, tanggal_mulai, tanggal_selesai, psikolog:psychologists(nama_profesional, tarif_sesi)")
        .eq("id_appointment", appointment_id)
        .maybe_single()
    )
    appt = result.data
    if not appt:
        raise not_found("Janji temu tidak ditemukan")
    if appt["id_user"] != user_id:
        raise forbidden("Hanya pemesan yang dapat membayar janji temu ini")
    if appt["status"] != "PENDING":
        raise bad_request("Janji temu ini tidak menunggu pembayaran")
    if _parse(appt["tanggal_mulai"]) <= _now():
        raise bad_request("Waktu sesi sudah lewat")

    psikolog = appt["psikolog"] or {}
    harga = Decimal(str(psikolog.get("tarif_sesi") or 0))
    if harga <= 0:
        raise bad_request("Sesi ini gratis, tidak perlu pembayaran")
    return {
        "harga": harga,
        "persen": get_settings().komisi_persen_psikolog,
        "judul": f"Sesi konsultasi dengan {psikolog.get('nama_profesional') or 'Psikolog'}",
        "batas": _parse(appt["tanggal_mulai"]),
    }


def _event_target(client: Client, user_id: str, event_id: str) -> dict:
    # Import di sini untuk menghindari import melingkar (event_service tidak butuh payment).
    from app.services import event_service

    event = event_service.get_event(client, user_id, event_id)
    if event["status_pendaftaran_saya"] in event_service.ACTIVE_PARTICIPANT:
        raise HTTPException(status.HTTP_409_CONFLICT, "Kamu sudah terdaftar di event ini")
    if not event["pendaftaran_dibuka"]:
        if event["sisa_kursi"] == 0:
            raise HTTPException(status.HTTP_409_CONFLICT, "Maaf, kursi untuk event ini sudah penuh")
        raise bad_request("Pendaftaran event ini sudah ditutup")

    harga = Decimal(str(event["harga"] or 0))
    if harga <= 0:
        raise bad_request("Event ini gratis, langsung daftar tanpa pembayaran")
    return {
        "harga": harga,
        "persen": get_settings().komisi_persen_event,
        "judul": event["judul"],
        "batas": event_service._registration_deadline(event),
    }


def _target(client: Client, user_id: str, jenis: str, id_appointment: str | None, id_event: str | None) -> dict:
    if jenis == "APPOINTMENT":
        return _appointment_target(client, user_id, id_appointment)
    return _event_target(client, user_id, id_event)


def _rincian(harga: Decimal, persen: Decimal) -> dict:
    biaya_layanan = get_settings().biaya_layanan.quantize(_RUPIAH)
    subtotal = harga.quantize(_RUPIAH, ROUND_HALF_UP)
    komisi = (subtotal * persen / 100).quantize(_RUPIAH, ROUND_HALF_UP)
    return {
        "subtotal": subtotal,
        "biaya_layanan": biaya_layanan,
        "total": subtotal + biaya_layanan,
        "persen_komisi": persen,
        "komisi_platform": komisi,
        "pendapatan_mitra": subtotal - komisi,
    }


# --- pengguna ------------------------------------------------------------------

def quote(client: Client, user_id: str, jenis: str, id_appointment: str | None, id_event: str | None) -> dict:
    target = _target(client, user_id, jenis, id_appointment, id_event)
    rincian = _rincian(target["harga"], target["persen"])
    return {
        "jenis": jenis,
        "judul": target["judul"],
        "subtotal": rincian["subtotal"],
        "biaya_layanan": rincian["biaya_layanan"],
        "total": rincian["total"],
    }


def _get_row(client: Client, payment_id: str) -> dict:
    result = run(client.table("payments").select(_SELECT).eq("id_payment", payment_id).maybe_single())
    if not result.data:
        raise not_found("Tagihan tidak ditemukan")
    return result.data


def _get_own(client: Client, user_id: str, payment_id: str) -> dict:
    row = _get_row(client, payment_id)
    if row["id_user"] != user_id:
        # Psikolog bisa melihat tagihan kliennya (RLS), tapi tidak bisa mengubahnya.
        raise forbidden("Tagihan ini bukan milikmu")
    return row


def create_payment(client: Client, user_id: str, payload: dict) -> dict:
    expire_stale_payments()
    jenis = payload["jenis"]
    id_appointment = payload.get("id_appointment") if jenis == "APPOINTMENT" else None
    id_event = payload.get("id_event") if jenis == "EVENT" else None
    target = _target(client, user_id, jenis, id_appointment, id_event)

    # Satu target hanya boleh punya 1 tagihan aktif (juga dijaga unique index).
    existing = client.table("payments").select("id_payment, status").eq("id_user", user_id)
    existing = existing.eq("id_appointment", id_appointment) if id_appointment else existing.eq("id_event", id_event)
    active = [p for p in run(existing.in_("status", ["PENDING", "PAID"])).data]
    if any(p["status"] == "PAID" for p in active):
        raise HTTPException(status.HTTP_409_CONFLICT, "Tagihan ini sudah lunas")
    if active:
        # Ganti metode bayar: tagihan lama ditutup, dibuat tagihan baru.
        run(
            get_service_client()
            .table("payments")
            .update({"status": "CANCELLED"})
            .eq("id_payment", active[0]["id_payment"])
            .eq("status", "PENDING")
        )

    expired_at = min(_now() + timedelta(minutes=get_settings().batas_bayar_menit), target["batas"])
    body = {
        "id_user": user_id,
        "jenis": jenis,
        "id_appointment": id_appointment,
        "id_event": id_event,
        **{k: str(v) for k, v in _rincian(target["harga"], target["persen"]).items()},
        "metode": payload["metode"],
        "kode_bayar": _kode_bayar(payload["metode"]),
        "expired_at": expired_at.isoformat(),
    }
    created = run(get_service_client().table("payments").insert(body).select("id_payment")).data[0]
    return _shape(_get_row(client, created["id_payment"]))


def list_my_payments(
    client: Client, user_id: str, id_appointment: str | None, id_event: str | None, limit: int, offset: int
) -> list[dict]:
    expire_stale_payments()
    query = client.table("payments").select(_SELECT).eq("id_user", user_id)
    if id_appointment:
        query = query.eq("id_appointment", id_appointment)
    if id_event:
        query = query.eq("id_event", id_event)
    rows = run(query.order("created_at", desc=True).range(offset, offset + limit - 1)).data
    return [_shape(r) for r in rows]


def get_payment(client: Client, user_id: str, payment_id: str) -> dict:
    expire_stale_payments()
    return _shape(_get_row(client, payment_id))


def simulate_paid(client: Client, user_id: str, payment_id: str) -> dict:
    """Pengganti webhook gateway: tandai lunas (dan daftarkan peserta event)."""
    expire_stale_payments()
    row = _get_own(client, user_id, payment_id)
    if row["status"] == "EXPIRED":
        raise bad_request("Batas waktu pembayaran sudah lewat, silakan buat tagihan baru")
    if row["status"] != "PENDING":
        raise bad_request("Tagihan ini sudah tidak menunggu pembayaran")
    run(get_service_client().rpc("confirm_payment", {"p_id_payment": payment_id}))
    return _shape(_get_row(client, payment_id))


def cancel_payment(client: Client, user_id: str, payment_id: str) -> dict:
    """Batalkan tagihan PENDING (mis. ingin ganti metode). Janji temu tetap ada."""
    row = _get_own(client, user_id, payment_id)
    if row["status"] != "PENDING":
        raise bad_request("Hanya tagihan yang belum dibayar yang dapat dibatalkan")
    run(
        get_service_client()
        .table("payments")
        .update({"status": "CANCELLED"})
        .eq("id_payment", payment_id)
        .eq("status", "PENDING")
    )
    return _shape(_get_row(client, payment_id))


# --- admin (service client) ----------------------------------------------------

def admin_list_payments(service: Client, status_filter: str | None, jenis: str | None, limit: int, offset: int) -> list[dict]:
    expire_stale_payments()
    query = service.table("payments").select(_SELECT).order("created_at", desc=True)
    if status_filter:
        query = query.eq("status", status_filter)
    if jenis:
        query = query.eq("jenis", jenis)
    return [_shape(r) for r in run(query.range(offset, offset + limit - 1)).data]


def admin_summary(service: Client) -> dict:
    rows = run(
        service.table("payments")
        .select("total, biaya_layanan, komisi_platform, pendapatan_mitra")
        .eq("status", "PAID")
    ).data

    def total(key: str) -> Decimal:
        return sum((Decimal(str(r[key])) for r in rows), Decimal("0"))

    return {
        "jumlah_transaksi": len(rows),
        "total_dibayar": total("total"),
        "total_biaya_layanan": total("biaya_layanan"),
        "total_komisi": total("komisi_platform"),
        "total_pendapatan_mitra": total("pendapatan_mitra"),
        "pendapatan_bina_jiwa": total("komisi_platform") + total("biaya_layanan"),
    }
