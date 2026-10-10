"""SQLAlchemy models for segment-level statistical analyses."""
from sqlalchemy import Column, Integer, String, Float
from app.db.base import Base


class SegmentStatistic(Base):
    """
    Stores segment statistics across sector, period (peak/non-peak),
    season, hour, and year.
    """
    __tablename__ = "segment_statistics"

    id = Column(Integer, primary_key=True, index=True)
    segment_type = Column(String(50), index=True, nullable=False)  # sector, period, season, hourly, year
    segment_value = Column(String(50), index=True, nullable=False) # e.g. Residential, Peak, Summer, 2024
    count = Column(Integer, nullable=False)
    mean_kwh = Column(Float, nullable=False)
    std_kwh = Column(Float, nullable=False)
    median_kwh = Column(Float, nullable=False)
    min_kwh = Column(Float, nullable=False)
    max_kwh = Column(Float, nullable=False)
    skewness = Column(Float, nullable=False)
    kurtosis = Column(Float, nullable=False)
    best_fit_dist = Column(String(50), nullable=False)
    dist_shape = Column(Float, nullable=True)
    dist_loc = Column(Float, nullable=False, default=0.0)
    dist_scale = Column(Float, nullable=False)
    ks_stat = Column(Float, nullable=False)
