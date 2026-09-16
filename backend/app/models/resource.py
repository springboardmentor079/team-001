from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.base import Base


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    # excavator | concrete_mixer | crane | dump_truck | generator | safety_equipment
    category = Column(String(30), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    # available | in_use | maintenance | unavailable
    status = Column(String(20), default="available")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
