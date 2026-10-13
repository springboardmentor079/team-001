from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_role
from app.database.session import get_db
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseOut, ProjectBudget
from app.services import expense_service

router = APIRouter(tags=["Budget & Expenses"])
READ_ROLES = ("admin", "project_manager", "client")
WRITE_ROLES = ("admin", "project_manager")


@router.get("/api/expenses", response_model=list[ExpenseOut])
def list_expenses(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*READ_ROLES)),
):
    return expense_service.list_expenses(db, project_id)


@router.post("/api/expenses", response_model=ExpenseOut, status_code=201)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*WRITE_ROLES)),
):
    return expense_service.create_expense(db, payload, current_user.id)


@router.delete("/api/expenses/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*WRITE_ROLES)),
):
    expense_service.delete_expense(db, expense_id)


@router.get("/api/budget/overview", response_model=list[ProjectBudget])
def budget_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(*READ_ROLES)),
):
    """Planned budget vs. actual spend for every project."""
    return expense_service.budget_overview(db)
