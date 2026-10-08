from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, model_validator

PaymentType = Literal["APPOINTMENT", "EVENT"]
PaymentStatus = Literal["PENDING", "PAID", "EXPIRED", "CANCELLED", "REFUNDED"]
PaymentMethod = Literal["QRIS", "VA_BCA", "VA_BNI", "VA_MANDIRI", "GOPAY", "OVO", "DANA"]


class _PaymentTarget(BaseModel):
    jenis: PaymentType
    id_appointment: str | None = None
    id_event: str | None = None

    @model_validator(mode="after")
    def _check_target(self) -> "_PaymentTarget":
        if self.jenis == "APPOINTMENT" and not self.id_appointment:
            raise ValueError("id_appointment wajib diisi untuk pembayaran sesi psikolog")
        if self.jenis == "EVENT" and not self.id_event:
            raise ValueError("id_event wajib diisi untuk pembayaran event")
        return self


class PaymentQuoteRequest(_PaymentTarget):
    pass


class PaymentCreate(_PaymentTarget):
    metode: PaymentMethod


class PaymentQuote(BaseModel):
    """Rincian biaya sebelum user memilih metode bayar (halaman checkout)."""

    jenis: PaymentType
    judul: str
    subtotal: Decimal
    biaya_layanan: Decimal
    total: Decimal


class PaymentTargetInfo(BaseModel):
    judul: str
    tanggal_mulai: datetime | None = None
    tanggal_selesai: datetime | None = None


class PaymentOut(BaseModel):
    id_payment: str
    id_user: str
    jenis: PaymentType
    id_appointment: str | None = None
    id_event: str | None = None
    subtotal: Decimal
    biaya_layanan: Decimal
    total: Decimal
    persen_komisi: Decimal
    komisi_platform: Decimal
    pendapatan_mitra: Decimal
    metode: PaymentMethod
    kode_bayar: str
    status: PaymentStatus
    expired_at: datetime
    paid_at: datetime | None = None
    refunded_at: datetime | None = None
    tujuan: PaymentTargetInfo | None = None
    created_at: datetime
    updated_at: datetime


class PaymentSummary(BaseModel):
    """Ringkasan untuk panel admin (hanya transaksi PAID yang dihitung)."""

    jumlah_transaksi: int
    total_dibayar: Decimal
    total_biaya_layanan: Decimal
    total_komisi: Decimal
    total_pendapatan_mitra: Decimal
    pendapatan_bina_jiwa: Decimal
