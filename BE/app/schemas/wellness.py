from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

# Pilihan mood yang tersedia di aplikasi (kolom mood_entries.mood bertipe varchar).
MoodValue = Literal["Sangat Baik", "Tenang", "Biasa", "Cemas", "Sedih", "Lelah"]


class MoodEntryCreate(BaseModel):
    mood: MoodValue
    intensitas: int = Field(ge=1, le=5)
    # FE menyimpan faktor pemicu + catatan singkat di sini (format "Faktor: a, b\n<catatan>").
    catatan: str | None = Field(default=None, max_length=2000)


class MoodEntryUpdate(BaseModel):
    mood: MoodValue | None = None
    intensitas: int | None = Field(default=None, ge=1, le=5)
    catatan: str | None = Field(default=None, max_length=2000)


class MoodEntryOut(BaseModel):
    id_mood_entry: str
    id_user: str
    mood: str
    intensitas: int
    catatan: str | None = None
    created_at: datetime


class JournalCreate(BaseModel):
    judul: str = Field(min_length=1, max_length=150)
    isi: str = Field(min_length=1, max_length=10000)


class JournalUpdate(BaseModel):
    judul: str | None = Field(default=None, min_length=1, max_length=150)
    isi: str | None = Field(default=None, min_length=1, max_length=10000)


class JournalOut(BaseModel):
    id_journal: str
    id_user: str
    judul: str
    isi: str
    created_at: datetime
    updated_at: datetime
