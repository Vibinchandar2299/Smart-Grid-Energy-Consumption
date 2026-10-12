"""Pydantic schemas for probability distributions, goodness-of-fit, and curve visualization."""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, ConfigDict


class DescriptiveStatisticsSchema(BaseModel):
    scope: str = "overall"
    count: int
    mean: float
    std: float
    variance: float
    min_val: float
    q25: float
    median: float
    q75: float
    max_val: float
    skewness: float
    kurtosis: float

    model_config = ConfigDict(from_attributes=True)


class DistributionFitSchema(BaseModel):
    distribution: str
    param_shape: Optional[float] = None
    param_loc: float = 0.0
    param_scale: float
    aic: float
    bic: float
    ks_statistic: float
    ks_pvalue: float
    ad_statistic: Optional[float] = None
    rank: int
    parameters_json: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class CurvePoint(BaseModel):
    x: float
    empirical_density: Optional[float] = None
    normal_pdf: Optional[float] = None
    lognormal_pdf: Optional[float] = None
    gamma_pdf: Optional[float] = None
    weibull_pdf: Optional[float] = None


class DistributionComparisonResponse(BaseModel):
    descriptive_statistics: DescriptiveStatisticsSchema
    distribution_fits: List[DistributionFitSchema]
    best_distribution: str
    selection_rationale: str
