"""Consumption analysis, interactive filtering, and high-demand detection endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import PlainTextResponse
from app.api.deps import get_consumption_service
from app.services.consumption_service import ConsumptionService
from app.schemas.common import ApiResponse

router = APIRouter()


@router.get("/options", response_model=ApiResponse[dict])
def get_filter_options(
    service: ConsumptionService = Depends(get_consumption_service),
):
    """Returns available filtering dimensions supported by the authentic dataset."""
    data = service.get_filter_options()
    return ApiResponse(
        data=data,
        message="Filter options retrieved successfully."
    )


@router.get("/filter", response_model=ApiResponse[dict])
def filter_consumption_records(
    sector: Optional[str] = Query(default=None),
    year: Optional[int] = Query(default=None, ge=2015, le=2024),
    month: Optional[int] = Query(default=None, ge=1, le=12),
    season: Optional[str] = Query(default=None),
    hour: Optional[int] = Query(default=None, ge=0, le=23),
    hour_band: Optional[str] = Query(default=None),
    peak_period: Optional[int] = Query(default=None, ge=0, le=1),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    service: ConsumptionService = Depends(get_consumption_service),
):
    """
    Filters raw consumption records and dynamically recalculates empirical statistics,
    hourly diurnal profiles, and sector distributions.
    """
    data = service.filter_consumption(
        sector=sector,
        year=year,
        month=month,
        season=season,
        hour=hour,
        hour_band=hour_band,
        peak_period=peak_period,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )
    return ApiResponse(
        data=data,
        message="Filtered consumption data and statistics calculated successfully."
    )


@router.get("/high-consumption", response_model=ApiResponse[dict])
def get_high_consumption_analysis(
    percentile: float = Query(default=99.0, ge=90.0, le=99.9),
    sector: Optional[str] = Query(default=None),
    year: Optional[int] = Query(default=None, ge=2015, le=2024),
    month: Optional[int] = Query(default=None, ge=1, le=12),
    season: Optional[str] = Query(default=None),
    hour: Optional[int] = Query(default=None, ge=0, le=23),
    peak_period: Optional[int] = Query(default=None, ge=0, le=1),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    service: ConsumptionService = Depends(get_consumption_service),
):
    """
    Identifies statistically high consumption observations exceeding the selected
    empirical percentile threshold (default 99th percentile).
    """
    data = service.detect_high_consumption(
        percentile=percentile,
        sector=sector,
        year=year,
        month=month,
        season=season,
        hour=hour,
        peak_period=peak_period,
        limit=limit,
        offset=offset,
    )
    return ApiResponse(
        data=data,
        message=f"High-consumption observations above {percentile}th percentile identified successfully."
    )


@router.get("/export-csv")
def export_filtered_consumption_csv(
    sector: Optional[str] = Query(default=None),
    year: Optional[int] = Query(default=None, ge=2015, le=2024),
    month: Optional[int] = Query(default=None, ge=1, le=12),
    season: Optional[str] = Query(default=None),
    hour: Optional[int] = Query(default=None, ge=0, le=23),
    hour_band: Optional[str] = Query(default=None),
    peak_period: Optional[int] = Query(default=None, ge=0, le=1),
    start_date: Optional[str] = Query(default=None),
    end_date: Optional[str] = Query(default=None),
    max_records: int = Query(default=5000, ge=1, le=20000),
    service: ConsumptionService = Depends(get_consumption_service),
):
    """Exports filtered consumption observations as a downloadable CSV file."""
    csv_content = service.export_filtered_csv(
        sector=sector,
        year=year,
        month=month,
        season=season,
        hour=hour,
        hour_band=hour_band,
        peak_period=peak_period,
        start_date=start_date,
        end_date=end_date,
        max_records=max_records,
    )

    filename = f"smart_grid_filtered_consumption_{sector or 'all'}_{year or 'all'}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
