from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.base import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    generated_by = Column(Integer, ForeignKey("users.id"))
    # progress | resource_utilization | budget | workforce | procurement
    report_type = Column(String(30), nullable=False)
    file_path = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
