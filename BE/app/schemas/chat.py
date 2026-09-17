from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator

MessageType = Literal["TEXT", "AUDIO"]


class ConversationCreate(BaseModel):
    id_psychologist: str
    id_appointment: str | None = None


class ConversationOut(BaseModel):
    id_conversation: str
    id_appointment: str | None = None
    id_user: str
    id_psychologist: str
    status: Literal["ACTIVE", "COMPLETED", "ARCHIVED"]
    created_at: datetime
    updated_at: datetime


class MessageCreate(BaseModel):
    message_type: MessageType = "TEXT"
    isi: str | None = None
    attachment_url: str | None = None

    @model_validator(mode="after")
    def _check_content(self):
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
