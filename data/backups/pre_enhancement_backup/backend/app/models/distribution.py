"""SQLAlchemy models for probability distribution fits and descriptive statistics."""
from sqlalchemy import Column, Integer, String, Float, JSON
from app.db.base import Base


class DescriptiveStatistic(Base):
    """Stores overall descriptive statistics of energy_consumption_kwh."""
    __tablename__ = "descriptive_statistics"

    id = Column(Integer, primary_key=True, index=True)
    scope = Column(String(50), default="overall", unique=True, index=True)
    count = Column(Integer, nullable=False)
    mean = Column(Float, nullable=False)
    std = Column(Float, nullable=False)
    variance = Column(Float, nullable=False)
    min_val = Column(Float, nullable=False)
    q25 = Column(Float, nullable=False)
    median = Column(Float, nullable=False)
    q75 = Column(Float, nullable=False)
    max_val = Column(Float, nullable=False)
    skewness = Column(Float, nullable=False)
    kurtosis = Column(Float, nullable=False)


class DistributionFit(Base):
    """Stores fitted probability distribution parameters and goodness-of-fit metrics."""
    __tablename__ = "distribution_fits"

    id = Column(Integer, primary_key=True, index=True)
    distribution = Column(String(50), unique=True, index=True, nullable=False)
    param_shape = Column(Float, nullable=True)
    param_loc = Column(Float, nullable=False, default=0.0)
    param_scale = Column(Float, nullable=False)
    aic = Column(Float, nullable=False)
    bic = Column(Float, nullable=False)
    ks_statistic = Column(Float, nullable=False)
    ks_pvalue = Column(Float, nullable=False)
    ad_statistic = Column(Float, nullable=True)
    rank = Column(Integer, nullable=False)
    parameters_json = Column(JSON, nullable=True)
