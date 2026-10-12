"""Pydantic schemas for extreme value analysis and return periods."""
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ExtremeValueItem(BaseModel):
    block_type: str
    sample_maxima_count: int
    shape_xi: float
    loc_mu: float
    scale_sigma: float
    return_period_days: Optional[int] = None
    return_period_years: Optional[float] = None
    return_level_kwh: float
    ci_lower_95: Optional[float] = None
    ci_upper_95: Optional[float] = None
    reciprocal_rate: Optional[float] = None
    daily_exceedance_rate: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class GevParameters(BaseModel):
    shape_xi: float
    loc_mu: float
    scale_sigma: float
    domain_type: str  # Frechet, Gumbel, or Weibull (based on xi sign)


class ExtremeValueAnalysisResponse(BaseModel):
    block_type: str
    gev_parameters: GevParameters
    return_levels: List[ExtremeValueItem]
    statistical_summary: str
