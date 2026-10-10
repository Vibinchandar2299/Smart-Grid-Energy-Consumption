"""Hourly consumption and diurnal pattern analysis endpoint."""
from fastapi import APIRouter, Depends
from app.api.deps import get_segment_service
from app.services.segment_service import SegmentService
from app.schemas.common import ApiResponse
from app.schemas.segment import HourlyAnalysisResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[HourlyAnalysisResponse])
def get_hourly_profiles(
    service: SegmentService = Depends(get_segment_service),
):
    """Returns 24-hour diurnal profile and peak period indicators."""
    data = service.get_hourly_profiles()
    return ApiResponse(
        data=data,
        message="Hourly profile analysis retrieved successfully."
    )
