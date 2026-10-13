from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: int
    project_id: Optional[int]
    filename: str
    content_type: Optional[str]
    size_bytes: int
    uploaded_by: int
    created_at: datetime

    class Config:
        from_attributes = True
