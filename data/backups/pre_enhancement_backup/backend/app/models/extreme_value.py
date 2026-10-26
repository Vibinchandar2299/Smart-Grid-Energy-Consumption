"""SQLAlchemy models for Generalized Extreme Value (GEV) analysis and return levels."""
from sqlalchemy import Column, Integer, String, Float
from app.db.base import Base


class ExtremeValueResult(Base):
    """
    Stores GEV block maxima parameters and return level estimates
    derived from extreme value theory.
    """
    __tablename__ = "extreme_value_results"

    id = Column(Integer, primary_key=True, index=True)
    block_type = Column(String(50), index=True, nullable=False) # monthly_maxima, daily_maxima
    sample_maxima_count = Column(Integer, nullable=False)
    shape_xi = Column(Float, nullable=False)
    loc_mu = Column(Float, nullable=False)
    scale_sigma = Column(Float, nullable=False)
    return_period_days = Column(Integer, index=True, nullable=True)
    return_period_years = Column(Float, index=True, nullable=True)
    return_level_kwh = Column(Float, nullable=False)
    ci_lower_95 = Column(Float, nullable=True)
    ci_upper_95 = Column(Float, nullable=True)
