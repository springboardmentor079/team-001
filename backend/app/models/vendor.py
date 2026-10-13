from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database.base import Base


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False)
    # raw_materials | equipment | machinery | safety_equipment | office_supplies
    category = Column(String(30), nullable=False)
    contact_person = Column(String(120))
    email = Column(String(120))
    phone = Column(String(30))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
