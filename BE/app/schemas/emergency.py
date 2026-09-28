from datetime import datetime

from pydantic import BaseModel, Field


class EmergencyContactCreate(BaseModel):
    nama: str = Field(min_length=1, max_length=150)
    jenis: str = Field(min_length=1, max_length=50)
    nomor_telepon: str | None = Field(default=None, max_length=30)
    website_url: str | None = None
    deskripsi: str | None = None


class EmergencyContactUpdate(BaseModel):
    nama: str | None = Field(default=None, min_length=1, max_length=150)
    jenis: str | None = Field(default=None, min_length=1, max_length=50)
    nomor_telepon: str | None = Field(default=None, max_length=30)
    website_url: str | None = None
    deskripsi: str | None = None
    is_active: bool | None = None


class EmergencyContactOut(BaseModel):
    id_emergency_contact: str
    nama: str
    jenis: str
    nomor_telepon: str | None = None
    website_url: str | None = None
    deskripsi: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
