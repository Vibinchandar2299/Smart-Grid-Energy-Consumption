"""Pydantic schemas for segment analyses (sector, peak/non-peak, seasonal, hourly, temporal)."""
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class SegmentStatisticSchema(BaseModel):
    segment_type: str
    segment_value: str
    count: int
    mean_kwh: float
    std_kwh: float
    median_kwh: float
    min_kwh: float
    max_kwh: float
    skewness: float
    kurtosis: float
    best_fit_dist: str
    dist_shape: Optional[float] = None
    dist_loc: float = 0.0
    dist_scale: float
    ks_stat: float

    model_config = ConfigDict(from_attributes=True)


class SectorAnalysisResponse(BaseModel):
    sectors: List[SegmentStatisticSchema]
    highest_consuming_sector: str
    highest_volatility_sector: str
    statistical_summary: str


class PeakAnalysisResponse(BaseModel):
    peak: SegmentStatisticSchema
    non_peak: SegmentStatisticSchema
    ratio_peak_to_non_peak_mean: float
    statistical_summary: str


class SeasonalAnalysisResponse(BaseModel):
    seasons: List[SegmentStatisticSchema]
    peak_season: str
    lowest_season: str
    statistical_summary: str


class HourlyProfilePoint(BaseModel):
    hour: int
    mean_kwh: float
    std_kwh: float
    median_kwh: float
    peak_period_flag: bool


class HourlyAnalysisResponse(BaseModel):
    hourly_profiles: List[HourlyProfilePoint]
    peak_hours_range: str
    statistical_summary: str


class TemporalShiftItem(BaseModel):
    year: int
    mean_kwh: float
    std_kwh: float
    median_kwh: float
    skewness: float
    kurtosis: float
    best_fit_dist: str
    shift_percentage: float


class TemporalShiftResponse(BaseModel):
    shifts: List[TemporalShiftItem]
    overall_trend: str
    statistical_summary: str
