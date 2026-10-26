"""Sector analysis endpoint."""
from fastapi import APIRouter, Depends
from app.api.deps import get_segment_service
from app.services.segment_service import SegmentService
from app.schemas.common import ApiResponse
from app.schemas.segment import SectorAnalysisResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[SectorAnalysisResponse])
def get_sector_analysis(
    service: SegmentService = Depends(get_segment_service),
):
    """Returns sector-wise energy consumption statistics and fitted distribution comparisons."""
    data = service.get_sector_analysis()
    return ApiResponse(
        data=data,
        message="Sector distribution metrics retrieved successfully."
    )
