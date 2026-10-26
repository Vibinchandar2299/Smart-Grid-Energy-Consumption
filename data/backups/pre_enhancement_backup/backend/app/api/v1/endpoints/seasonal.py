"""Seasonal distribution analysis endpoint."""
from fastapi import APIRouter, Depends
from app.api.deps import get_segment_service
from app.services.segment_service import SegmentService
from app.schemas.common import ApiResponse
from app.schemas.segment import SeasonalAnalysisResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[SeasonalAnalysisResponse])
def get_seasonal_analysis(
    service: SegmentService = Depends(get_segment_service),
):
    """Returns seasonal consumption patterns and distribution characteristics."""
    data = service.get_seasonal_analysis()
    return ApiResponse(
        data=data,
        message="Seasonal distribution analysis retrieved successfully."
    )
