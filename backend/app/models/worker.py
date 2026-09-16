from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func

from app.database.base import Base


class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    # engineer | supervisor | contractor | skilled | unskilled | consultant
    category = Column(String(30), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    contact_number = Column(String(20))
    daily_wage = Column(Numeric(10, 2), default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
