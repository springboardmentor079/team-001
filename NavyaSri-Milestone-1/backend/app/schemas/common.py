"""Shared generic response envelope used across the API."""
from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """
    Consistent response envelope.

        {"success": true,  "message": "...", "data": {...}}
        {"success": false, "message": "...", "data": null}
    """

    success: bool
    message: str
    data: Optional[Any] = None
