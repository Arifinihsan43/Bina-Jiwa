from fastapi import APIRouter, Depends, status
from supabase import Client

from app.core.security import CurrentUser, get_scoped_client, require_admin
from app.core.supabase_client import get_anon_client
from app.schemas.emergency import (
    EmergencyContactCreate,
    EmergencyContactOut,
    EmergencyContactUpdate,
)
from app.services import emergency_service

router = APIRouter(prefix="/emergency-contacts", tags=["emergency-contacts"])


@router.get("", response_model=list[EmergencyContactOut])
def list_contacts() -> list[EmergencyContactOut]:
    return emergency_service.list_contacts(get_anon_client(), active_only=True)


@router.post("", response_model=EmergencyContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(
    payload: EmergencyContactCreate,
    _: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_scoped_client),
) -> EmergencyContactOut:
    return emergency_service.create_contact(client, payload.model_dump(mode="json"))


@router.patch("/{contact_id}", response_model=EmergencyContactOut)
def update_contact(
    contact_id: str,
    payload: EmergencyContactUpdate,
    _: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_scoped_client),
) -> EmergencyContactOut:
    body = payload.model_dump(mode="json", exclude_unset=True)
    return emergency_service.update_contact(client, contact_id, body)


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: str,
    _: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_scoped_client),
) -> None:
    emergency_service.delete_contact(client, contact_id)
