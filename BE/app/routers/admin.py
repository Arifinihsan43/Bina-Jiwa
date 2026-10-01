from fastapi import APIRouter, Depends, Query
from supabase import Client

from app.core.security import require_admin_key
from app.schemas.common import Message
from app.schemas.forum import CategoryCreate, CategoryOut, CategoryUpdate
from app.schemas.psychologist import PsychologistOut, PsychologistVerify, VerificationStatus
from app.schemas.report import AdminReportModerate, AdminReportOut, ReportStatus
from app.services import forum_service, psychologist_service, report_service

DEFAULT_CATEGORIES = [
    ("Curhat Anonim", "Ruang bebas untuk menuangkan isi hati tanpa dihakimi."),
    ("Kecemasan & Stres", "Berbagi pengalaman dan cara menghadapi rasa cemas."),
    ("Burnout Kerja", "Kelelahan, tekanan, dan batasan di dunia kerja atau kuliah."),
    ("Keluarga & Hubungan", "Dinamika keluarga, pertemanan, dan pasangan."),
    ("Kisah Pemulihan", "Cerita perjalanan pulih untuk saling menguatkan."),
]

# Panel admin tanpa akun: semua endpoint di sini dijaga header X-Admin-Key
# (lihat ADMIN_ACCESS_KEY di .env) dan memakai service role client.
router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/check", response_model=Message)
def check_access(_: Client = Depends(require_admin_key)) -> Message:
    return Message(message="Kode akses valid")


@router.get("/psychologists", response_model=list[PsychologistOut])
def admin_list_psychologists(
    verification_status: VerificationStatus | None = None,
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    client: Client = Depends(require_admin_key),
) -> list[PsychologistOut]:
    return psychologist_service.list_for_admin(client, verification_status, limit, offset)


@router.patch("/psychologists/{psychologist_id}/verify", response_model=PsychologistOut)
def admin_verify_psychologist(
    psychologist_id: str,
    payload: PsychologistVerify,
    client: Client = Depends(require_admin_key),
) -> PsychologistOut:
    return psychologist_service.set_verification(
        client, psychologist_id, payload.verification_status, payload.catatan
    )


# --- kategori komunitas ------------------------------------------------------

@router.get("/categories", response_model=list[CategoryOut])
def admin_list_categories(client: Client = Depends(require_admin_key)) -> list[CategoryOut]:
    return forum_service.list_categories(client, only_active=False)


@router.post("/categories", response_model=CategoryOut, status_code=201)
def admin_create_category(
    payload: CategoryCreate, client: Client = Depends(require_admin_key)
) -> CategoryOut:
    return forum_service.create_category(client, payload.model_dump(mode="json"))


@router.post("/categories/defaults", response_model=list[CategoryOut])
def admin_seed_default_categories(client: Client = Depends(require_admin_key)) -> list[CategoryOut]:
    """Tambahkan kategori bawaan yang belum ada (berdasarkan slug)."""
    existing = {c["slug"] for c in forum_service.list_categories(client, only_active=False)}
    for nama, deskripsi in DEFAULT_CATEGORIES:
        if forum_service.slugify(nama) not in existing:
            forum_service.create_category(client, {"nama_kategori": nama, "deskripsi": deskripsi})
    return forum_service.list_categories(client, only_active=False)


@router.patch("/categories/{category_id}", response_model=CategoryOut)
def admin_update_category(
    category_id: str, payload: CategoryUpdate, client: Client = Depends(require_admin_key)
) -> CategoryOut:
    body = payload.model_dump(mode="json", exclude_unset=True)
    return forum_service.update_category(client, category_id, body)


# --- laporan komunitas -------------------------------------------------------

@router.get("/reports", response_model=list[AdminReportOut])
def admin_list_reports(
    status: ReportStatus | None = None,
    limit: int = Query(default=100, ge=1, le=200),
    client: Client = Depends(require_admin_key),
) -> list[AdminReportOut]:
    return report_service.list_reports_with_preview(client, status, limit)


@router.patch("/reports/{report_id}", response_model=AdminReportOut)
def admin_moderate_report(
    report_id: str, payload: AdminReportModerate, client: Client = Depends(require_admin_key)
) -> AdminReportOut:
    report_service.moderate_report(client, report_id, payload.status, payload.sembunyikan_konten)
    return report_service.list_reports_with_preview(client, None, 1, report_id=report_id)[0]
