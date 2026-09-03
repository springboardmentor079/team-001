"""
Shared response envelope schemas.
"""
from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class MessageResponse(BaseModel):
    """Generic success message."""
    message: str


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated list response."""
    total: int
    page: int
    page_size: int
    items: List[T]


class ErrorDetail(BaseModel):
    detail: str
