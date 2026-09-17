from fastapi import APIRouter, Depends, Query
from supabase import Client

from app.core.security import CurrentUser, get_current_user, get_scoped_client
from app.schemas.common import Message
from app.schemas.notification import NotificationOut
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    unread_only: bool = Query(default=False),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> list[NotificationOut]:
    return notification_service.list_notifications(
        client, current_user.id, unread_only, limit, offset
    )


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> NotificationOut:
    return notification_service.mark_read(client, current_user.id, notification_id)


@router.patch("/read-all", response_model=Message)
def mark_all_read(
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> Message:
    notification_service.mark_all_read(client, current_user.id)
    return Message(message="Semua notifikasi ditandai sudah dibaca")
