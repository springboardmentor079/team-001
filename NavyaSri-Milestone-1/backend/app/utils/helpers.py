"""Miscellaneous helper functions shared across services/routers."""
import random
import string
from typing import Any, Optional


def success_response(message: str, data: Optional[Any] = None) -> dict:
    """Build a standard success envelope: {success, message, data}."""
    return {"success": True, "message": message, "data": data}


def error_response(message: str, data: Optional[Any] = None) -> dict:
    """Build a standard error envelope: {success, message, data}."""
    return {"success": False, "message": message, "data": data}


def generate_project_code(prefix: str = "BT") -> str:
    """Generate a short, human-readable project code, e.g. 'BT-7K2F9Q'."""
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}-{suffix}"
