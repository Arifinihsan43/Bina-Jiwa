from datetime import datetime

from pydantic import BaseModel, Field


class MoodEntryCreate(BaseModel):
    mood: str = Field(min_length=1, max_length=30)
    intensitas: int = Field(ge=1, le=5)
    catatan: str | None = None


class MoodEntryUpdate(BaseModel):
    mood: str | None = Field(default=None, min_length=1, max_length=30)
    intensitas: int | None = Field(default=None, ge=1, le=5)
    catatan: str | None = None


class MoodEntryOut(BaseModel):
    id_mood_entry: str
    id_user: str
    mood: str
    intensitas: int
    catatan: str | None = None
    created_at: datetime


class JournalCreate(BaseModel):
    judul: str = Field(min_length=1, max_length=150)
    isi: str = Field(min_length=1)


class JournalUpdate(BaseModel):
    judul: str | None = Field(default=None, min_length=1, max_length=150)
    isi: str | None = Field(default=None, min_length=1)


class JournalOut(BaseModel):
    id_journal: str
    id_user: str
    judul: str
    isi: str
    created_at: datetime
    updated_at: datetime
