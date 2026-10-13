import os
import re
import uuid
from typing import Optional

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.project import Project
from app.models.user import User

ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt",
    ".png", ".jpg", ".jpeg", ".ppt", ".pptx", ".dwg", ".zip",
}


def _upload_dir() -> str:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    return settings.UPLOAD_DIR


def _safe_filename(name: str) -> str:
    name = os.path.basename(name or "file")
    name = re.sub(r"[^A-Za-z0-9._ -]", "_", name).strip() or "file"
    return name[:200]


def save_document(db: Session, upload: UploadFile, project_id: Optional[int], user: User) -> Document:
    filename = _safe_filename(upload.filename or "file")
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext or 'unknown'}' is not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    if project_id is not None and not db.query(Project).filter(Project.id == project_id).first():
        raise HTTPException(status_code=404, detail="Project not found")

    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    data = upload.file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File too large (max {settings.MAX_UPLOAD_MB} MB)")
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    stored_name = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(_upload_dir(), stored_name), "wb") as fh:
        fh.write(data)

    doc = Document(
        project_id=project_id,
        filename=filename,
        stored_name=stored_name,
        content_type=upload.content_type,
        size_bytes=len(data),
        uploaded_by=user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def list_documents(db: Session, project_id: Optional[int] = None) -> list[Document]:
    query = db.query(Document)
    if project_id:
        query = query.filter(Document.project_id == project_id)
    return query.order_by(Document.created_at.desc(), Document.id.desc()).all()


def get_document(db: Session, doc_id: int) -> Document:
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


def file_path(doc: Document) -> str:
    path = os.path.join(_upload_dir(), doc.stored_name)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File is missing on the server")
    return path


def delete_document(db: Session, doc: Document) -> None:
    path = os.path.join(_upload_dir(), doc.stored_name)
    if os.path.exists(path):
        os.remove(path)
    db.delete(doc)
    db.commit()
