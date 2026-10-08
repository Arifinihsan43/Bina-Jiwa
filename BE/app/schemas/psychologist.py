from datetime import datetime, time
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, model_validator

VerificationStatus = Literal["PENDING", "VERIFIED", "REJECTED"]
AppointmentStatus = Literal["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]
SessionType = Literal["ONLINE", "OFFLINE"]


class PsychologistCreate(BaseModel):
    nama_profesional: str = Field(min_length=1, max_length=100)
    spesialisasi: str | None = Field(default=None, max_length=150)
    bio: str | None = None
    kota: str | None = Field(default=None, max_length=50)
    alamat_praktik: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    nomor_himpsi: str | None = Field(default=None, max_length=50)
    nomor_sipp: str | None = Field(default=None, max_length=50)
    dokumen_verifikasi_url: str | None = None
    tarif_sesi: Decimal = Field(default=Decimal("0"), ge=0, le=Decimal("10000000"))


class PsychologistUpdate(BaseModel):
    nama_profesional: str | None = Field(default=None, min_length=1, max_length=100)
    spesialisasi: str | None = Field(default=None, max_length=150)
    bio: str | None = None
    kota: str | None = Field(default=None, max_length=50)
    alamat_praktik: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    nomor_himpsi: str | None = Field(default=None, max_length=50)
    nomor_sipp: str | None = Field(default=None, max_length=50)
    dokumen_verifikasi_url: str | None = None
    tarif_sesi: Decimal | None = Field(default=None, ge=0, le=Decimal("10000000"))
    status: Literal["ACTIVE", "INACTIVE"] | None = None


class PsychologistVerify(BaseModel):
    verification_status: Literal["VERIFIED", "REJECTED"]
    catatan: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def _require_reason_on_reject(self) -> "PsychologistVerify":
        if self.verification_status == "REJECTED" and not (self.catatan or "").strip():
            raise ValueError("Alasan penolakan wajib diisi")
        return self


class PsychologistOut(BaseModel):
    id_psychologist: str
    id_user: str
    nama_profesional: str
    spesialisasi: str | None = None
    bio: str | None = None
    kota: str | None = None
    alamat_praktik: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    status: Literal["ACTIVE", "INACTIVE"]
    tarif_sesi: Decimal = Decimal("0")
    nomor_himpsi: str | None = None
    nomor_sipp: str | None = None
    dokumen_verifikasi_url: str | None = None
    verification_status: VerificationStatus
    catatan_verifikasi: str | None = None
    created_at: datetime
    updated_at: datetime


class ScheduleCreate(BaseModel):
    hari: int = Field(ge=1, le=7)
    jam_mulai: time
    jam_selesai: time


class ScheduleUpdate(BaseModel):
    hari: int | None = Field(default=None, ge=1, le=7)
    jam_mulai: time | None = None
    jam_selesai: time | None = None
    is_active: bool | None = None


class ScheduleOut(BaseModel):
    id_schedule: str
    id_psychologist: str
    hari: int
    jam_mulai: time
    jam_selesai: time
    is_active: bool
    created_at: datetime


class PsychologistPublicOut(BaseModel):
    """Data psikolog yang boleh dilihat user lain (tanpa dokumen verifikasi)."""

    id_psychologist: str
    id_user: str
    nama_profesional: str
    spesialisasi: str | None = None
    bio: str | None = None
    kota: str | None = None
    alamat_praktik: str | None = None
    latitude: Decimal | None = None
    longitude: Decimal | None = None
    status: Literal["ACTIVE", "INACTIVE"]
    tarif_sesi: Decimal = Decimal("0")
    nomor_himpsi: str | None = None
    nomor_sipp: str | None = None
    verification_status: VerificationStatus
    jadwal: list[ScheduleOut] = []
    created_at: datetime
    updated_at: datetime


class AppointmentCreate(BaseModel):
    id_psychologist: str
    tanggal_mulai: datetime
    tanggal_selesai: datetime
    type: SessionType
    # lokasi ditentukan server (alamat praktik / sesi online), bukan oleh pemesan.
    catatan: str | None = Field(default=None, max_length=1000)


class AppointmentUpdate(BaseModel):
    status: AppointmentStatus | None = None
    catatan: str | None = Field(default=None, max_length=1000)
    lokasi: str | None = Field(default=None, max_length=500)


class AppointmentPsychologistInfo(BaseModel):
    nama_profesional: str
    kota: str | None = None
    alamat_praktik: str | None = None


class AppointmentClientInfo(BaseModel):
    nama_lengkap: str
    username: str | None = None


class AppointmentPaymentInfo(BaseModel):
    """Tagihan terakhir untuk janji temu ini (lihat /payments)."""

    id_payment: str
    status: Literal["PENDING", "PAID", "EXPIRED", "CANCELLED", "REFUNDED"]
    total: Decimal
    expired_at: datetime


class AppointmentOut(BaseModel):
    id_appointment: str
    id_user: str
    id_psychologist: str
    tanggal_mulai: datetime
    tanggal_selesai: datetime
    type: SessionType
    lokasi: str | None = None
    catatan: str | None = None
    status: AppointmentStatus
    psikolog: AppointmentPsychologistInfo | None = None
    klien: AppointmentClientInfo | None = None
    tarif_sesi: Decimal = Decimal("0")
    # True bila sesi berbayar dan belum lunas (psikolog belum bisa konfirmasi).
    perlu_bayar: bool = False
    pembayaran: AppointmentPaymentInfo | None = None
    created_at: datetime
    updated_at: datetime


class BusySlotOut(BaseModel):
    tanggal_mulai: datetime
    tanggal_selesai: datetime
