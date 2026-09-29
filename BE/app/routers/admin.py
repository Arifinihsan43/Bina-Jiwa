from fastapi import APIRouter, Depends, Query
from supabase import Client

from app.core.security import require_admin_key
from app.schemas.common import Message
from app.schemas.psychologist import PsychologistOut, PsychologistVerify, VerificationStatus
from app.services import psychologist_service

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
