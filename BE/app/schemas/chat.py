from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

MessageType = Literal["TEXT", "AUDIO"]


class ConversationPsychologistInfo(BaseModel):
    nama_profesional: str
    id_user: str


class ConversationClientInfo(BaseModel):
    nama_lengkap: str


class LastMessageInfo(BaseModel):
    id_sender: str
    message_type: MessageType
    isi: str | None = None
    created_at: datetime


class ConversationOut(BaseModel):
    id_conversation: str
    id_appointment: str | None = None
    id_user: str
    id_psychologist: str
    status: Literal["ACTIVE", "COMPLETED", "ARCHIVED"]
    psikolog: ConversationPsychologistInfo | None = None
    klien: ConversationClientInfo | None = None
    pesan_terakhir: LastMessageInfo | None = None
    jumlah_belum_dibaca: int = 0
    created_at: datetime
    updated_at: datetime


class MessageCreate(BaseModel):
    message_type: MessageType = "TEXT"
    isi: str | None = Field(default=None, max_length=4000)
    attachment_url: str | None = Field(default=None, max_length=500)

    @field_validator("attachment_url")
    @classmethod
    def _http_only(cls, value: str | None) -> str | None:
        if value and not value.lower().startswith(("https://", "http://")):
            raise ValueError("attachment_url harus berupa tautan http(s)")
        return value

    @model_validator(mode="after")
    def _check_content(self):
        if self.isi is not None:
            self.isi = self.isi.strip() or None
        if not self.isi and not self.attachment_url:
            raise ValueError("Pesan harus punya isi teks atau attachment_url")
        return self


class MessageOut(BaseModel):
    id_message: str
    id_conversation: str
    id_sender: str
    message_type: MessageType
    isi: str | None = None
    attachment_url: str | None = None
    is_read: bool
    created_at: datetime
