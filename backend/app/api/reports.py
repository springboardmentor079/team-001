from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.database.session import get_db
from app.models.user import User
from app.services import report_service

router = APIRouter(prefix="/api/reports", tags=["Reports & Analytics"])

MEDIA_TYPES = {
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "pdf": "application/pdf",
    "csv": "text/csv",
}


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "project_manager", "client")),
):
    return report_service.get_summary(db)


@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "project_manager", "client")),
):
    """Grouped numbers that power the dashboard / analytics charts."""
    return report_service.get_analytics(db)


@router.get("/history")
def history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "project_manager")),
):
    return report_service.report_history(db)


@router.get("/export/{kind}")
def export_report(
    kind: str,
    format: str = Query("xlsx", pattern="^(xlsx|pdf|csv)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "project_manager", "client")),
):
    if kind not in report_service.EXPORT_KINDS:
        raise HTTPException(status_code=404, detail=f"Unknown report '{kind}'")
    if current_user.role == "client" and kind not in report_service.CLIENT_KINDS:
        raise HTTPException(status_code=403, detail="You do not have permission to export this report")

    dataset = report_service.build_dataset(db, kind)
    content = {
        "xlsx": report_service.to_xlsx,
        "pdf": report_service.to_pdf,
        "csv": report_service.to_csv,
    }[format](dataset)

    filename = f"buildtrack-{kind}-{datetime.now().strftime('%Y%m%d-%H%M')}.{format}"
    report_service.log_report(db, kind, filename, current_user.id)
    return Response(
        content=content,
        media_type=MEDIA_TYPES[format],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
