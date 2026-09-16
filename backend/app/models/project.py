from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func

from app.database.base import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    # residential | commercial | industrial | infrastructure | government
    category = Column(String(30), nullable=False)
    # planned | in_progress | on_hold | completed | closed
    status = Column(String(20), nullable=False, default="planned")
    start_date = Column(Date)
    end_date = Column(Date)
    budget = Column(Numeric(14, 2), default=0)
    manager_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
