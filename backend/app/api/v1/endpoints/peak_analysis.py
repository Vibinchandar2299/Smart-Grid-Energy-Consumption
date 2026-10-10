"""Peak vs Non-Peak analysis endpoint."""
from fastapi import APIRouter, Depends
from app.api.deps import get_segment_service
from app.services.segment_service import SegmentService
from app.schemas.common import ApiResponse
from app.schemas.segment import PeakAnalysisResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[PeakAnalysisResponse])
def get_peak_analysis(
    service: SegmentService = Depends(get_segment_service),
):
    """Returns comparative metrics between peak and non-peak energy periods."""
    data = service.get_peak_analysis()
    return ApiResponse(
        data=data,
        message="Peak vs Non-Peak comparative analysis retrieved successfully."
    )
