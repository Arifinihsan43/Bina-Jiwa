from datetime import date

from fastapi import APIRouter, Depends, Query, status
from supabase import Client

from app.core.security import CurrentUser, get_current_user, get_scoped_client
from app.schemas.common import Message
from app.schemas.wellness import (
    JournalCreate,
    JournalOut,
    JournalUpdate,
    MoodEntryCreate,
    MoodEntryOut,
    MoodEntryUpdate,
)
from app.services import wellness_service

router = APIRouter(prefix="/wellness", tags=["wellness"])


@router.get("/moods", response_model=list[MoodEntryOut])
def list_moods(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    dari: date | None = Query(default=None, description="Tanggal awal (WIB), inklusif"),
    sampai: date | None = Query(default=None, description="Tanggal akhir (WIB), inklusif"),
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> list[MoodEntryOut]:
    return wellness_service.list_moods(client, current_user.id, limit, offset, dari, sampai)


@router.post("/moods", response_model=MoodEntryOut, status_code=status.HTTP_201_CREATED)
def create_mood(
    payload: MoodEntryCreate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> MoodEntryOut:
    return wellness_service.create_mood(client, current_user.id, payload.model_dump(mode="json"))


@router.get("/moods/{mood_id}", response_model=MoodEntryOut)
def get_mood(
    mood_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> MoodEntryOut:
    return wellness_service.get_mood(client, current_user.id, mood_id)


@router.patch("/moods/{mood_id}", response_model=MoodEntryOut)
def update_mood(
    mood_id: str,
    payload: MoodEntryUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> MoodEntryOut:
    body = payload.model_dump(mode="json", exclude_unset=True)
    return wellness_service.update_mood(client, current_user.id, mood_id, body)


@router.delete("/moods/{mood_id}", response_model=Message)
def delete_mood(
    mood_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> Message:
    wellness_service.delete_mood(client, current_user.id, mood_id)
    return Message(message="Catatan mood dihapus")


@router.get("/journals", response_model=list[JournalOut])
def list_journals(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    dari: date | None = Query(default=None, description="Tanggal awal (WIB), inklusif"),
    sampai: date | None = Query(default=None, description="Tanggal akhir (WIB), inklusif"),
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> list[JournalOut]:
    return wellness_service.list_journals(client, current_user.id, limit, offset, dari, sampai)


@router.post("/journals", response_model=JournalOut, status_code=status.HTTP_201_CREATED)
def create_journal(
    payload: JournalCreate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> JournalOut:
    return wellness_service.create_journal(client, current_user.id, payload.model_dump(mode="json"))


@router.get("/journals/{journal_id}", response_model=JournalOut)
def get_journal(
    journal_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> JournalOut:
    return wellness_service.get_journal(client, current_user.id, journal_id)


@router.patch("/journals/{journal_id}", response_model=JournalOut)
def update_journal(
    journal_id: str,
    payload: JournalUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> JournalOut:
    body = payload.model_dump(mode="json", exclude_unset=True)
    return wellness_service.update_journal(client, current_user.id, journal_id, body)


@router.delete("/journals/{journal_id}", response_model=Message)
def delete_journal(
    journal_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> Message:
    wellness_service.delete_journal(client, current_user.id, journal_id)
    return Message(message="Jurnal dihapus")
