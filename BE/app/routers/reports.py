from fastapi import APIRouter, Depends, Query, status
from supabase import Client

from app.core.security import CurrentUser, get_current_user, get_scoped_client, require_admin
from app.schemas.report import ReportCreate, ReportOut, ReportUpdate
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def create_report(
    payload: ReportCreate,
    current_user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_scoped_client),
) -> ReportOut:
    return report_service.create_report(client, current_user.id, payload.model_dump(mode="json"))


@router.get("/me", response_model=list[ReportOut])
def list_my_reports(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    client: Client = Depends(get_scoped_client),
) -> list[ReportOut]:
    return report_service.list_my_reports(client, limit, offset)


@router.get("", response_model=list[ReportOut])
def list_all_reports(
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    _: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_scoped_client),
) -> list[ReportOut]:
    return report_service.list_all_reports(client, status_filter, limit, offset)


@router.patch("/{report_id}", response_model=ReportOut)
def update_report(
    report_id: str,
    payload: ReportUpdate,
    admin_user: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_scoped_client),
) -> ReportOut:
    return report_service.update_report_status(client, admin_user.id, report_id, payload.status)
