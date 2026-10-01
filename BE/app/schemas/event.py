from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, field_validator

EventStatus = Literal["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]
SessionType = Literal["ONLINE", "OFFLINE"]
ParticipantStatus = Literal["REGISTERED", "CANCELLED", "ATTENDED"]


def _http_url(value: str | None) -> str | None:
    if value and not value.lower().startswith(("https://", "http://")):
        raise ValueError("Harus berupa tautan http(s)")
    return value or None


class EventCreate(BaseModel):
    """Dibuat admin dari proposal yang masuk lewat email."""

    judul: str = Field(min_length=3, max_length=200)
    penyelenggara: str = Field(min_length=2, max_length=150)
    penyelenggara_info: str | None = Field(default=None, max_length=200)
    deskripsi: str | None = Field(default=None, max_length=5000)
    gambar_url: str | None = Field(default=None, max_length=500)
    tanggal_mulai: datetime
    tanggal_selesai: datetime
    lokasi: str | None = Field(default=None, max_length=500)
    type: SessionType
    link_meeting: str | None = Field(default=None, max_length=500)
    harga: Decimal = Field(default=Decimal("0"), ge=0, le=Decimal("100000000"))
    kapasitas: int | None = Field(default=None, gt=0, le=100000)
    batas_pendaftaran: datetime | None = None
    # Admin boleh langsung mempublikasikan atau menyimpan sebagai draf.
    status: Literal["DRAFT", "PUBLISHED"] = "DRAFT"

    _check_urls = field_validator("gambar_url", "link_meeting")(_http_url)


class EventUpdate(BaseModel):
    judul: str | None = Field(default=None, min_length=3, max_length=200)
    penyelenggara: str | None = Field(default=None, min_length=2, max_length=150)
    penyelenggara_info: str | None = Field(default=None, max_length=200)
    deskripsi: str | None = Field(default=None, max_length=5000)
    gambar_url: str | None = Field(default=None, max_length=500)
    tanggal_mulai: datetime | None = None
    tanggal_selesai: datetime | None = None
    lokasi: str | None = Field(default=None, max_length=500)
    type: SessionType | None = None
    link_meeting: str | None = Field(default=None, max_length=500)
    harga: Decimal | None = Field(default=None, ge=0, le=Decimal("100000000"))
    kapasitas: int | None = Field(default=None, gt=0, le=100000)
    batas_pendaftaran: datetime | None = None
    status: EventStatus | None = None

    _check_urls = field_validator("gambar_url", "link_meeting")(_http_url)


class OrganizerInfo(BaseModel):
    nama: str
    keterangan: str | None = None


class EventOut(BaseModel):
    id_event: str
    judul: str
    deskripsi: str | None = None
    gambar_url: str | None = None
    tanggal_mulai: datetime
    tanggal_selesai: datetime
    lokasi: str | None = None
    type: SessionType
    # Untuk pengguna: hanya terisi bila terdaftar. Untuk admin: selalu terisi.
    link_meeting: str | None = None
    harga: Decimal
    kapasitas: int | None = None
    batas_pendaftaran: datetime | None = None
    status: EventStatus
    penyelenggara: OrganizerInfo | None = None
    jumlah_peserta: int = 0
    sisa_kursi: int | None = None
    status_pendaftaran_saya: ParticipantStatus | None = None
    pendaftaran_dibuka: bool = False
    created_at: datetime
    updated_at: datetime


class ParticipantUpdate(BaseModel):
    status: ParticipantStatus


class MyRegistrationUpdate(BaseModel):
    status: Literal["REGISTERED", "CANCELLED"]


class ParticipantOut(BaseModel):
    id_event: str
    id_user: str
    status: ParticipantStatus
    registered_at: datetime
    attended_at: datetime | None = None


class EventParticipantOut(BaseModel):
    """Peserta yang dilihat admin (untuk mengirim tautan / info pembayaran)."""

    id_user: str
    nama_lengkap: str
    email: str | None = None
    status: ParticipantStatus
    registered_at: datetime
    attended_at: datetime | None = None
