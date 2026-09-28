from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ProfileOut(BaseModel):
    id_user: str
    nama_lengkap: str
    username: str
    role: Literal["USER", "PSYCHOLOGIST", "ADMIN"]
    foto_profil: str | None = None
    kota: str | None = None
    created_at: datetime
    updated_at: datetime


class ProfileUpdate(BaseModel):
    nama_lengkap: str | None = Field(default=None, min_length=1, max_length=100)
    foto_profil: str | None = None
    kota: str | None = Field(default=None, max_length=50)


class PersonaOut(BaseModel):
    id_persona: str
    id_user: str
    nama_persona: str
    foto_persona: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PersonaCreate(BaseModel):
    nama_persona: str = Field(min_length=1, max_length=50)
    foto_persona: str | None = None


class PersonaUpdate(BaseModel):
    nama_persona: str | None = Field(default=None, min_length=1, max_length=50)
    foto_persona: str | None = None
    is_active: bool | None = None
