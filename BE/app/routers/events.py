from fastapi import APIRouter, Depends, Query, status
from supabase import Client

from app.core.security import CurrentUser, get_current_user, get_scoped_client
from app.schemas.event import EventOut, MyRegistrationUpdate
from app.services import event_service

# Event dibuat & dikelola admin (lihat /admin/events). Pengguna melihat dan mendaftar.
router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventOut])
def list_events(
    upcoming_only: bool = Query(default=True),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> list[EventOut]:
    return event_service.list_events(client, current_user.id, upcoming_only, limit, offset)


@router.get("/me/registrations", response_model=list[EventOut])
def list_my_registrations(
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> list[EventOut]:
    return event_service.list_my_registrations(client, current_user.id)


@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> EventOut:
    return event_service.get_event(client, current_user.id, event_id)


@router.post("/{event_id}/register", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def register_for_event(
    event_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> EventOut:
    return event_service.register_participant(client, current_user.id, event_id)


@router.patch("/{event_id}/registration", response_model=EventOut)
def update_my_registration(
    event_id: str,
    payload: MyRegistrationUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> EventOut:
    if payload.status == "REGISTERED":
        return event_service.register_participant(client, current_user.id, event_id)
    return event_service.cancel_my_registration(client, current_user.id, event_id)
