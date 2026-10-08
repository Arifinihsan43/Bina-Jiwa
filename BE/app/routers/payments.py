from fastapi import APIRouter, Depends, Query, status
from supabase import Client

from app.core.security import CurrentUser, get_current_user, get_scoped_client
from app.schemas.payment import PaymentCreate, PaymentOut, PaymentQuote, PaymentQuoteRequest
from app.services import payment_service

# Pembayaran simulasi untuk sesi psikolog & event berbayar (tanpa payment gateway).
router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/quote", response_model=PaymentQuote)
def quote_payment(
    payload: PaymentQuoteRequest,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> PaymentQuote:
    """Rincian biaya untuk halaman checkout (belum membuat tagihan)."""
    return payment_service.quote(
        client, current_user.id, payload.jenis, payload.id_appointment, payload.id_event
    )


@router.post("", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment(
    payload: PaymentCreate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> PaymentOut:
    """Buat tagihan. Bila sudah ada tagihan PENDING untuk target yang sama, tagihan lama diganti."""
    return payment_service.create_payment(client, current_user.id, payload.model_dump())


@router.get("", response_model=list[PaymentOut])
def list_my_payments(
    id_appointment: str | None = None,
    id_event: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> list[PaymentOut]:
    return payment_service.list_my_payments(client, current_user.id, id_appointment, id_event, limit, offset)


@router.get("/{payment_id}", response_model=PaymentOut)
def get_payment(
    payment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> PaymentOut:
    return payment_service.get_payment(client, current_user.id, payment_id)


@router.post("/{payment_id}/simulate-paid", response_model=PaymentOut)
def simulate_paid(
    payment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> PaymentOut:
    """Tombol "Simulasikan Pembayaran Berhasil" — pengganti webhook payment gateway."""
    return payment_service.simulate_paid(client, current_user.id, payment_id)


@router.post("/{payment_id}/cancel", response_model=PaymentOut)
def cancel_payment(
    payment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> PaymentOut:
    return payment_service.cancel_payment(client, current_user.id, payment_id)
