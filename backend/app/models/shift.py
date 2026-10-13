from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func

from app.database.base import Base


class Shift(Base):
    __tablename__ = "shifts"
    __table_args__ = (UniqueConstraint("worker_id", "shift_date", name="uq_shift_worker_date"),)

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    shift_date = Column(Date, nullable=False)
    # morning | evening | night
    shift_type = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
