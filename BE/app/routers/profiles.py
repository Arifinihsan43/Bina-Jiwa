from fastapi import APIRouter, Depends, status
from supabase import Client

from app.core.security import CurrentUser, get_current_user, get_scoped_client
from app.schemas.profile import PersonaCreate, PersonaOut, PersonaUpdate, ProfileOut, ProfileUpdate
from app.services import profile_service

router = APIRouter(tags=["profiles"])


@router.get("/profiles/{user_id}", response_model=ProfileOut)
def get_profile(
    user_id: str,
    client: Client = Depends(get_scoped_client),
) -> ProfileOut:
    return profile_service.get_profile(client, user_id)


@router.patch("/profiles/me", response_model=ProfileOut)
def update_my_profile(
    payload: ProfileUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> ProfileOut:
    body = payload.model_dump(mode="json", exclude_unset=True)
    return profile_service.update_profile(client, current_user.id, body)


@router.get("/profiles/me/persona", response_model=PersonaOut)
def get_my_persona(
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> PersonaOut:
    return profile_service.get_own_persona(client, current_user.id)


@router.post("/profiles/me/persona", response_model=PersonaOut, status_code=status.HTTP_201_CREATED)
def create_my_persona(
    payload: PersonaCreate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> PersonaOut:
    body = payload.model_dump(mode="json")
    return profile_service.create_persona(client, current_user.id, body)


@router.patch("/profiles/me/persona", response_model=PersonaOut)
def update_my_persona(
    payload: PersonaUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> PersonaOut:
    body = payload.model_dump(mode="json", exclude_unset=True)
    return profile_service.update_persona(client, current_user.id, body)
