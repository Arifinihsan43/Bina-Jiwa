from datetime import datetime, timezone

from fastapi import HTTPException, status
from supabase import Client

from app.core.errors import bad_request, not_found, run

# target_type -> (tabel, kolom id)
_TARGET_TABLES = {
    "POST": ("posts", "id_post"),
    "ANSWER": ("answers", "id_answer"),
    "ANSWER_COMMENT": ("answer_comments", "id_comment"),
}


def create_report(client: Client, reporter_id: str, payload: dict) -> dict:
    target = _TARGET_TABLES.get(payload["target_type"])
    if not target:
        raise bad_request("Jenis laporan tidak didukung")
    table, key = target

    # Target harus konten yang bisa dilihat pelapor (RLS) dan masih tayang.
    found = run(
        client.table(table).select("status").eq(key, payload["target_id"]).maybe_single()
    ).data
    if not found or found["status"] != "PUBLISHED":
        raise not_found("Konten yang dilaporkan tidak ditemukan")

    duplicate = run(
        client.table("reports")
        .select("id_report")
        .eq("id_reporter", reporter_id)
        .eq("target_type", payload["target_type"])
        .eq("target_id", payload["target_id"])
        .eq("status", "PENDING")
        .limit(1)
    ).data
    if duplicate:
        raise HTTPException(status.HTTP_409_CONFLICT, "Kamu sudah melaporkan konten ini. Tim kami sedang meninjaunya.")

    body = {**payload, "id_reporter": reporter_id}
    return run(client.table("reports").insert(body).select("*")).data[0]


def list_my_reports(client: Client, limit: int, offset: int) -> list[dict]:
    result = run(
        client.table("reports")
        .select("*")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
    )
    return result.data


def list_all_reports(
    client: Client, status_filter: str | None, limit: int, offset: int
) -> list[dict]:
    query = client.table("reports").select("*").order("created_at", desc=True)
    if status_filter:
        query = query.eq("status", status_filter)
    return run(query.range(offset, offset + limit - 1)).data


def update_report_status(client: Client, admin_id: str | None, report_id: str, status_value: str) -> dict:
    result = run(
        client.table("reports")
        .update(
            {
                "status": status_value,
                "reviewed_by": admin_id,
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("id_report", report_id)
        .select("*")
    )
    if not result.data:
        raise not_found("Laporan tidak ditemukan")
    return result.data[0]


# --- Panel admin (service client) --------------------------------------------

def list_reports_with_preview(
    service: Client, status_filter: str | None, limit: int, report_id: str | None = None
) -> list[dict]:
    """Laporan beserta cuplikan konten yang dilaporkan (tanpa identitas asli pelapor/penulis)."""
    query = service.table("reports").select("*").order("created_at", desc=True).limit(limit)
    if status_filter:
        query = query.eq("status", status_filter)
    if report_id:
        query = query.eq("id_report", report_id)
    reports = run(query).data

    ids_by_type: dict[str, set[str]] = {}
    for r in reports:
        ids_by_type.setdefault(r["target_type"], set()).add(r["target_id"])

    previews: dict[tuple[str, str], dict] = {}
    for target_type, ids in ids_by_type.items():
        if target_type not in _TARGET_TABLES:
            continue
        table, key = _TARGET_TABLES[target_type]
        cols = f"{key}, isi, status, persona:personas(nama_persona)"
        if target_type == "POST":
            cols += ", judul"
        for row in run(service.table(table).select(cols).in_(key, list(ids))).data:
            previews[(target_type, row[key])] = {
                "judul": row.get("judul"),
                "isi": row["isi"],
                "status": row["status"],
                "nama_persona": (row.get("persona") or {}).get("nama_persona"),
            }

    # Jumlah laporan per konten, supaya admin tahu mana yang paling banyak dilaporkan.
    counts: dict[tuple[str, str], int] = {}
    for r in reports:
        k = (r["target_type"], r["target_id"])
        counts[k] = counts.get(k, 0) + 1

    for r in reports:
        k = (r["target_type"], r["target_id"])
        r.pop("id_reporter", None)
        r["konten"] = previews.get(k)
        r["jumlah_laporan_konten"] = counts[k]
    return reports


def moderate_report(service: Client, report_id: str, status_value: str, hide_content: bool) -> dict:
    report = run(service.table("reports").select("*").eq("id_report", report_id).maybe_single()).data
    if not report:
        raise not_found("Laporan tidak ditemukan")

    now = datetime.now(timezone.utc).isoformat()
    target = _TARGET_TABLES.get(report["target_type"])
    if hide_content and target:
        table, key = target
        run(service.table(table).update({"status": "HIDDEN"}).eq(key, report["target_id"]))

    # Selesaikan semua laporan tertunda untuk konten yang sama sekaligus.
    run(
        service.table("reports")
        .update({"status": status_value, "reviewed_at": now})
        .eq("target_type", report["target_type"])
        .eq("target_id", report["target_id"])
        .eq("status", "PENDING")
    )
    run(
        service.table("reports")
        .update({"status": status_value, "reviewed_at": now})
        .eq("id_report", report_id)
    )
    return run(service.table("reports").select("*").eq("id_report", report_id).maybe_single()).data
