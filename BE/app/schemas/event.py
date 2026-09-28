from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

EventStatus = Literal["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"]
SessionType = Literal["ONLINE", "OFFLINE"]
ParticipantStatus = Literal["REGISTERED", "CANCELLED", "ATTENDED"]


class EventCreate(BaseModel):
    judul: str = Field(min_length=1, max_length=200)
    deskripsi: str | None = None
    gambar_url: str | None = None
    tanggal_mulai: datetime
    tanggal_selesai: datetime
    lokasi: str | None = None
    type: SessionType
    link_meeting: str | None = None
    harga: Decimal = Decimal("0")
    kapasitas: int | None = Field(default=None, gt=0)
    batas_pendaftaran: datetime | None = None


class EventUpdate(BaseModel):
    judul: str | None = Field(default=None, min_length=1, max_length=200)
    deskripsi: str | None = None
    gambar_url: str | None = None
    tanggal_mulai: datetime | None = None
    tanggal_selesai: datetime | None = None
    lokasi: str | None = None
    type: SessionType | None = None
    link_meeting: str | None = None
    harga: Decimal | None = None
    kapasitas: int | None = Field(default=None, gt=0)
    batas_pendaftaran: datetime | None = None
    status: EventStatus | None = None


class EventOut(BaseModel):
    id_event: str
    id_creator: str
    judul: str
    deskripsi: str | None = None
    gambar_url: str | None = None
    tanggal_mulai: datetime
    tanggal_selesai: datetime
    lokasi: str | None = None
    type: SessionType
    link_meeting: str | None = None
    harga: Decimal
    kapasitas: int | None = None
    batas_pendaftaran: datetime | None = None
    status: EventStatus
    created_at: datetime
    updated_at: datetime


class ParticipantUpdate(BaseModel):
    status: ParticipantStatus


class ParticipantOut(BaseModel):
    id_event: str
    id_user: str
    status: ParticipantStatus
    registered_at: datetime
    attended_at: datetime | None = None
