from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel

ShiftType = Literal["morning", "evening", "night"]


class ShiftCreate(BaseModel):
    worker_id: int
    project_id: int
    shift_date: date
    shift_type: ShiftType


class ShiftOut(BaseModel):
    id: int
    worker_id: int
    project_id: int
    shift_date: date
    shift_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class PayrollLine(BaseModel):
    worker_id: int
    worker_name: str
    category: str
    daily_wage: float
    present_days: int
    half_days: int
    absent_days: int
    leave_days: int
    payable_days: float
    amount: float


class PayrollReport(BaseModel):
    start: date
    end: date
    total_amount: float
    lines: list[PayrollLine]
