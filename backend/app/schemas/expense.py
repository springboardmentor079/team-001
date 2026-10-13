from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field

ExpenseCategory = Literal[
    "labor", "material", "equipment", "transportation", "maintenance", "administrative"
]


class ExpenseCreate(BaseModel):
    project_id: int
    category: ExpenseCategory
    amount: float = Field(gt=0)
    description: Optional[str] = Field(default=None, max_length=255)
    expense_date: Optional[date] = None


class ExpenseOut(BaseModel):
    id: int
    project_id: int
    category: str
    amount: float
    description: Optional[str]
    expense_date: date
    created_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectBudget(BaseModel):
    project_id: int
    project_name: str
    status: str
    budget: float
    spent: float
    remaining: float
    utilisation_pct: float
    spent_by_category: dict[str, float]
