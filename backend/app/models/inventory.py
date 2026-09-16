from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.base import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    material_name = Column(String(120), nullable=False)
    # cement | steel | bricks | sand | concrete | electrical | plumbing
    category = Column(String(30), nullable=False)
    quantity = Column(Numeric(12, 2), default=0)
    unit = Column(String(20), default="unit")
    reorder_level = Column(Numeric(12, 2), default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
