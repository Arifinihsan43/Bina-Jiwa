from fastapi import APIRouter, Depends, File, UploadFile

from app.core.security import CurrentUser, get_current_user
from app.services import storage_service

router = APIRouter(prefix="/storage", tags=["storage"])


@router.post("/upload/{bucket}")
async def upload_file(
    bucket: str,
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict:
    content = await file.read()
    url = storage_service.upload_file(
        bucket=bucket,
        user_id=current_user.id,
        filename=file.filename or "upload.bin",
        content=content,
        content_type=file.content_type or "application/octet-stream",
    )
    return {"url": url}
