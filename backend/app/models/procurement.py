from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.base import Base


class Procurement(Base):
    __tablename__ = "procurements"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    item_name = Column(String(120), nullable=False)
    # raw_materials | equipment | machinery | safety_equipment | office_supplies
    category = Column(String(30), nullable=False)
    vendor_name = Column(String(120))
    quantity = Column(Numeric(12, 2), default=0)
    cost = Column(Numeric(14, 2), default=0)
    # requested | approved | ordered | delivered | rejected
    status = Column(String(20), default="requested")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
