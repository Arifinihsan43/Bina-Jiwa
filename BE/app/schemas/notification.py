from datetime import datetime

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id_notification: str
    id_user: str
    type: str
    title: str
    message: str
    reference_id: str | None = None
    is_read: bool
    created_at: datetime
