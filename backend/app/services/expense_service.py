from datetime import date
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.models.project import Project
from app.schemas.expense import ExpenseCreate
from app.services import notification_service


def _project_spent(db: Session, project_id: int) -> float:
    return float(
        db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(Expense.project_id == project_id).scalar() or 0
    )


def create_expense(db: Session, payload: ExpenseCreate, user_id: int) -> Expense:
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    data = payload.model_dump()
    data["expense_date"] = data["expense_date"] or date.today()
    expense = Expense(**data, created_by=user_id)
    db.add(expense)
    db.commit()
    db.refresh(expense)

    budget = float(project.budget or 0)
    if budget > 0:
        pct = _project_spent(db, project.id) / budget * 100
        if pct >= 90:
            notification_service.notify_user(
                db, project.manager_id, "Budget alert",
                f"Project '{project.name}' has used {pct:.0f}% of its budget.",
                "project_update", email=True, dedupe=True,
            )
    return expense


def list_expenses(db: Session, project_id: Optional[int] = None) -> list[Expense]:
    query = db.query(Expense)
    if project_id:
        query = query.filter(Expense.project_id == project_id)
    return query.order_by(Expense.expense_date.desc(), Expense.id.desc()).all()


def delete_expense(db: Session, expense_id: int) -> None:
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()


def budget_overview(db: Session) -> list[dict]:
    projects = db.query(Project).order_by(Project.id).all()
    by_cat_rows = (
        db.query(Expense.project_id, Expense.category, func.sum(Expense.amount))
        .group_by(Expense.project_id, Expense.category)
        .all()
    )
    by_cat: dict[int, dict[str, float]] = {}
    for pid, cat, total in by_cat_rows:
        by_cat.setdefault(pid, {})[cat] = float(total or 0)

    result = []
    for p in projects:
        cats = by_cat.get(p.id, {})
        spent = sum(cats.values())
        budget = float(p.budget or 0)
        result.append({
            "project_id": p.id,
            "project_name": p.name,
            "status": p.status,
            "budget": budget,
            "spent": spent,
            "remaining": budget - spent,
            "utilisation_pct": round(spent / budget * 100, 1) if budget > 0 else 0.0,
            "spent_by_category": cats,
        })
    return result
