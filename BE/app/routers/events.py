from fastapi import APIRouter, Depends, Query, status
from supabase import Client

from app.core.security import CurrentUser, get_current_user, get_scoped_client
from app.schemas.common import Message
from app.schemas.event import (
    EventCreate,
    EventOut,
    EventUpdate,
    ParticipantOut,
    ParticipantUpdate,
)
from app.services import event_service

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventOut])
def list_events(
    upcoming_only: bool = Query(default=True),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    client: Client = Depends(get_scoped_client),
) -> list[EventOut]:
    return event_service.list_events(client, upcoming_only, limit, offset)


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> EventOut:
    return event_service.create_event(client, current_user.id, payload.model_dump(mode="json"))


@router.get("/me/registrations", response_model=list[ParticipantOut])
def list_my_registrations(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    client: Client = Depends(get_scoped_client),
) -> list[ParticipantOut]:
    return event_service.list_my_registrations(client, limit, offset)


@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: str, client: Client = Depends(get_scoped_client)) -> EventOut:
    return event_service.get_event(client, event_id)


@router.patch("/{event_id}", response_model=EventOut)
def update_event(
    event_id: str,
    payload: EventUpdate,
    client: Client = Depends(get_scoped_client),
) -> EventOut:
    body = payload.model_dump(mode="json", exclude_unset=True)
    return event_service.update_event(client, event_id, body)


@router.post("/{event_id}/register", response_model=ParticipantOut, status_code=status.HTTP_201_CREATED)
def register_for_event(
    event_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> ParticipantOut:
    return event_service.register_participant(client, current_user.id, event_id)


@router.get("/{event_id}/participants", response_model=list[ParticipantOut])
def list_participants(
    event_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    client: Client = Depends(get_scoped_client),
) -> list[ParticipantOut]:
    return event_service.list_participants(client, event_id, limit, offset)


@router.patch("/{event_id}/participants/{user_id}", response_model=ParticipantOut)
def update_participant(
    event_id: str,
    user_id: str,
    payload: ParticipantUpdate,
    client: Client = Depends(get_scoped_client),
) -> ParticipantOut:
    return event_service.update_participant(client, event_id, user_id, payload.model_dump(mode="json"))
