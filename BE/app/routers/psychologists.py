from datetime import date

from fastapi import APIRouter, Depends, Query, status
from supabase import Client

from app.core.security import CurrentUser, get_current_user, get_scoped_client, require_admin
from app.schemas.psychologist import (
    AppointmentCreate,
    AppointmentOut,
    AppointmentUpdate,
    BusySlotOut,
    PsychologistCreate,
    PsychologistOut,
    PsychologistPublicOut,
    PsychologistUpdate,
    PsychologistVerify,
    ScheduleCreate,
    ScheduleOut,
    ScheduleUpdate,
)
from app.services import psychologist_service

router = APIRouter(tags=["psychologists"])


# --- psychologists ---------------------------------------------------------

@router.get("/psychologists", response_model=list[PsychologistPublicOut])
def list_psychologists(
    kota: str | None = None,
    spesialisasi: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    client: Client = Depends(get_scoped_client),
) -> list[PsychologistPublicOut]:
    return psychologist_service.list_psychologists(client, kota, spesialisasi, limit, offset)


@router.get("/psychologists/me", response_model=PsychologistOut)
def get_my_psychologist_profile(
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> PsychologistOut:
    return psychologist_service.get_own_psychologist(client, current_user.id)


@router.post(
    "/psychologists/me", response_model=PsychologistOut, status_code=status.HTTP_201_CREATED
)
def register_as_psychologist(
    payload: PsychologistCreate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> PsychologistOut:
    return psychologist_service.register_psychologist(
        client, current_user.id, payload.model_dump(mode="json")
    )


@router.patch("/psychologists/me", response_model=PsychologistOut)
def update_my_psychologist_profile(
    payload: PsychologistUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> PsychologistOut:
    body = payload.model_dump(mode="json", exclude_unset=True)
    return psychologist_service.update_own_psychologist(client, current_user.id, body)


@router.get("/psychologists/{psychologist_id}", response_model=PsychologistPublicOut)
def get_psychologist(
    psychologist_id: str, client: Client = Depends(get_scoped_client)
) -> PsychologistPublicOut:
    return psychologist_service.get_psychologist(client, psychologist_id)


@router.patch("/psychologists/{psychologist_id}/verify", response_model=PsychologistOut)
def verify_psychologist(
    psychologist_id: str,
    payload: PsychologistVerify,
    _: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_scoped_client),
) -> PsychologistOut:
    return psychologist_service.set_verification(
        client, psychologist_id, payload.verification_status, payload.catatan
    )


# --- schedules ---------------------------------------------------------

@router.get("/psychologists/{psychologist_id}/schedules", response_model=list[ScheduleOut])
def list_schedules(
    psychologist_id: str,
    active_only: bool = Query(default=True),
    client: Client = Depends(get_scoped_client),
) -> list[ScheduleOut]:
    return psychologist_service.list_schedules(client, psychologist_id, active_only)


@router.post(
    "/psychologists/me/schedules", response_model=ScheduleOut, status_code=status.HTTP_201_CREATED
)
def create_my_schedule(
    payload: ScheduleCreate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> ScheduleOut:
    own = psychologist_service.get_own_psychologist(client, current_user.id)
    return psychologist_service.create_schedule(
        client, own["id_psychologist"], payload.model_dump(mode="json")
    )


@router.patch("/psychologists/me/schedules/{schedule_id}", response_model=ScheduleOut)
def update_my_schedule(
    schedule_id: str,
    payload: ScheduleUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> ScheduleOut:
    own = psychologist_service.get_own_psychologist(client, current_user.id)
    body = payload.model_dump(mode="json", exclude_unset=True)
    return psychologist_service.update_schedule(client, own["id_psychologist"], schedule_id, body)


@router.delete("/psychologists/me/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_schedule(
    schedule_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> None:
    own = psychologist_service.get_own_psychologist(client, current_user.id)
    psychologist_service.delete_schedule(client, own["id_psychologist"], schedule_id)


# --- appointments ---------------------------------------------------------

@router.get("/psychologists/{psychologist_id}/busy", response_model=list[BusySlotOut])
def list_busy_slots(
    psychologist_id: str,
    tanggal: date,
    _: CurrentUser = Depends(get_current_user),
) -> list[BusySlotOut]:
    """Jam yang sudah dipesan pada tanggal tsb (WIB) — untuk menyembunyikan slot penuh."""
    return psychologist_service.list_busy_slots(psychologist_id, tanggal)


@router.get("/appointments", response_model=list[AppointmentOut])
def list_my_appointments(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    client: Client = Depends(get_scoped_client),
) -> list[AppointmentOut]:
    return psychologist_service.list_appointments_for_user(client, limit, offset)


@router.post("/appointments", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: AppointmentCreate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> AppointmentOut:
    return psychologist_service.create_appointment(client, current_user.id, payload)


@router.get("/appointments/{appointment_id}", response_model=AppointmentOut)
def get_appointment(
    appointment_id: str, client: Client = Depends(get_scoped_client)
) -> AppointmentOut:
    return psychologist_service.get_appointment(client, appointment_id)


@router.patch("/appointments/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: str,
    payload: AppointmentUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> AppointmentOut:
    body = payload.model_dump(mode="json", exclude_unset=True)
    return psychologist_service.update_appointment(client, current_user.id, appointment_id, body)
