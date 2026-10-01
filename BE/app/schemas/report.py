from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

TargetType = Literal["POST", "ANSWER", "ANSWER_COMMENT", "USER"]
ReportStatus = Literal["PENDING", "REVIEWED", "RESOLVED", "REJECTED"]


class ReportCreate(BaseModel):
    # Laporan dari komunitas hanya untuk konten (bukan akun), supaya tidak membuka identitas.
    target_type: Literal["POST", "ANSWER", "ANSWER_COMMENT"]
    target_id: str
    reason: str = Field(min_length=1, max_length=50)
    description: str | None = Field(default=None, max_length=1000)


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


class ReportedContent(BaseModel):
    judul: str | None = None
    isi: str
    status: Literal["PUBLISHED", "HIDDEN", "DELETED"]
    nama_persona: str | None = None


class AdminReportOut(BaseModel):
    id_report: str
    target_type: TargetType
    target_id: str
    reason: str
    description: str | None = None
    status: ReportStatus
    reviewed_at: datetime | None = None
    created_at: datetime
    konten: ReportedContent | None = None
    jumlah_laporan_konten: int = 1


class AdminReportModerate(BaseModel):
    status: Literal["RESOLVED", "REJECTED"]
    # True = sembunyikan konten yang dilaporkan dari komunitas.
    sembunyikan_konten: bool = False
