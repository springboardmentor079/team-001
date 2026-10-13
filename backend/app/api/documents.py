from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_role
from app.database.session import get_db
from app.models.user import User
from app.schemas.document import DocumentOut
from app.services import document_service

router = APIRouter(prefix="/api/documents", tags=["Documents"])
UPLOAD_ROLES = ("admin", "project_manager", "site_engineer", "contractor")


@router.get("/", response_model=list[DocumentOut])
def list_documents(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return document_service.list_documents(db, project_id)


@router.post("/", response_model=DocumentOut, status_code=201)
def upload_document(
    file: UploadFile = File(...),
    project_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*UPLOAD_ROLES)),
):
    return document_service.save_document(db, file, project_id, current_user)


@router.get("/{doc_id}/download")
def download_document(
    doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    doc = document_service.get_document(db, doc_id)
    return FileResponse(
        document_service.file_path(doc),
        filename=doc.filename,
        media_type=doc.content_type or "application/octet-stream",
    )


@router.delete("/{doc_id}", status_code=204)
def delete_document(
    doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    doc = document_service.get_document(db, doc_id)
    if current_user.role not in ("admin", "project_manager") and doc.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own documents")
    document_service.delete_document(db, doc)
