from datetime import datetime, timezone

from supabase import Client

from app.core.errors import not_found, run


def create_report(client: Client, reporter_id: str, payload: dict) -> dict:
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


def update_report_status(client: Client, admin_id: str, report_id: str, status_value: str) -> dict:
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
