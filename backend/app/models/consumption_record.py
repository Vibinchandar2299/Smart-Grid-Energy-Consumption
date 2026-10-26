"""SQLAlchemy ORM model for raw energy consumption observations."""
from sqlalchemy import Column, BigInteger, String, Integer, Float, DateTime
from app.db.base import Base


class EnergyConsumptionRecord(Base):
    """
    Stores individual smart meter observations calibrated to Tamil Nadu grid demand.
    Supports high-performance dynamic filtering, percentile threshold calculation,
    and granular time-series and sector queries.
    """
    __tablename__ = "energy_consumption_records"

    id = Column(BigInteger, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    state = Column(String(50))
    district = Column(String(50), index=True)
    sector = Column(String(50), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    month = Column(Integer, nullable=False, index=True)
    quarter = Column(Integer)
    season = Column(String(50), nullable=False, index=True)
    day_of_month = Column(Integer)
    day_of_week = Column(Integer)
    weekend_flag = Column(Integer)
    holiday_flag = Column(Integer)
    day_type = Column(String(50))
    hour = Column(Integer, nullable=False, index=True)
    peak_period_flag = Column(Integer, nullable=False, index=True)
    energy_consumption_kwh = Column(Float, nullable=False, index=True)
    generation_event_type = Column(String(50))
