"""Extreme value analysis and GEV return levels endpoint."""
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_extreme_value_service
from app.services.extreme_value_service import ExtremeValueService
from app.schemas.common import ApiResponse
from app.schemas.extreme_value import ExtremeValueAnalysisResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[ExtremeValueAnalysisResponse])
def get_extreme_values(
    block_type: str = Query(default="daily_maxima", pattern="^(daily_maxima|monthly_maxima)$"),
    service: ExtremeValueService = Depends(get_extreme_value_service),
):
    """
    Returns GEV distribution parameters (shape xi, loc mu, scale sigma)
    and return level projections (2, 5, 10, 25, 50, 100-year events) on block maxima.
    """
    data = service.get_extreme_value_analysis(block_type=block_type)
    return ApiResponse(
        data=data,
        message="Extreme value analysis and return levels retrieved successfully."
    )
