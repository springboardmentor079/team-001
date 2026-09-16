from sqlalchemy import Column, Integer, Date, String, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.database.base import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    date = Column(Date, nullable=False)
    # present | absent | half_day | leave
    status = Column(String(20), default="present")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
