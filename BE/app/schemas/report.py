from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

TargetType = Literal["POST", "ANSWER", "ANSWER_COMMENT", "USER"]
ReportStatus = Literal["PENDING", "REVIEWED", "RESOLVED", "REJECTED"]


class ReportCreate(BaseModel):
    target_type: TargetType
    target_id: str
    reason: str = Field(min_length=1, max_length=50)
    description: str | None = None


class ReportUpdate(BaseModel):
    status: ReportStatus


class ReportOut(BaseModel):
    id_report: str
    id_reporter: str
    target_type: TargetType
    target_id: str
    reason: str
    description: str | None = None
    status: ReportStatus
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
