"""Temporal distribution shift across years endpoint."""
from fastapi import APIRouter, Depends
from app.api.deps import get_segment_service
from app.services.segment_service import SegmentService
from app.schemas.common import ApiResponse
from app.schemas.segment import TemporalShiftResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[TemporalShiftResponse])
def get_temporal_shift(
    service: SegmentService = Depends(get_segment_service),
):
    """Returns year-over-year distribution shift metrics and trend indicators."""
    data = service.get_temporal_shift()
    return ApiResponse(
        data=data,
        message="Temporal distribution shift metrics retrieved successfully."
    )
