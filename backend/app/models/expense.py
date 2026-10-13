from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func

from app.database.base import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    # labor | material | equipment | transportation | maintenance | administrative
    category = Column(String(30), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    description = Column(String(255))
    expense_date = Column(Date, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
