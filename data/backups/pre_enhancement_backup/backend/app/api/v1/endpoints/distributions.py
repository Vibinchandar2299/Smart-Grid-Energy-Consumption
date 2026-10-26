"""Distribution analysis endpoints."""
from typing import List
from fastapi import APIRouter, Depends, Query
from app.api.deps import get_distribution_service
from app.services.distribution_service import DistributionService
from app.schemas.common import ApiResponse
from app.schemas.distribution import (
    DistributionComparisonResponse,
    CurvePoint,
)

router = APIRouter()


@router.get("/compare", response_model=ApiResponse[DistributionComparisonResponse])
def get_distribution_comparison(
    service: DistributionService = Depends(get_distribution_service),
):
    """
    Returns goodness-of-fit metrics (AIC, BIC, KS, AD) and parameter rankings
    for Normal, Log-normal, Gamma, and Weibull distributions.
    """
    data = service.get_distribution_comparison()
    return ApiResponse(
        data=data,
        message="Distribution comparison results retrieved successfully."
    )


@router.get("/curves", response_model=ApiResponse[List[CurvePoint]])
def get_distribution_curves(
    points: int = Query(default=100, ge=20, le=500),
    service: DistributionService = Depends(get_distribution_service),
):
    """
    Returns pre-computed PDF coordinates evaluated on frozen parameters
    strictly for UI chart rendering. No fitting performed.
    """
    data = service.generate_pdf_curve_points(points=points)
    return ApiResponse(
        data=data,
        message="Distribution curve evaluation coordinates retrieved successfully."
    )
