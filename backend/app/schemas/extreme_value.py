"""Pydantic schemas for extreme value analysis and return periods."""
from typing import List
from pydantic import BaseModel, ConfigDict


class ExtremeValueItem(BaseModel):
    block_type: str
    sample_maxima_count: int
    shape_xi: float
    loc_mu: float
    scale_sigma: float
    return_period_years: int
    return_level_kwh: float
    ci_lower_95: float
    ci_upper_95: float

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
