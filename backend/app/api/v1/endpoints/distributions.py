"""Distribution analysis endpoints."""
import io
import csv
from typing import List
from fastapi import APIRouter, Depends, Query, Response
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


@router.get("/export-csv")
def export_distribution_benchmarks_csv(
    service: DistributionService = Depends(get_distribution_service),
):
    """Exports distribution goodness-of-fit benchmark results as a CSV file."""
    comparison = service.get_distribution_comparison()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Rank",
        "Distribution",
        "AIC",
        "BIC",
        "KS_Statistic_D",
        "KS_pvalue",
        "AD_Statistic_A2",
        "Shape_Parameter",
        "Location_mu",
        "Scale_sigma",
    ])

    for fit in comparison.distribution_fits:
        writer.writerow([
            fit.rank,
            fit.distribution,
            round(fit.aic, 2),
            round(fit.bic, 2),
            round(fit.ks_statistic, 5),
            fit.ks_pvalue if fit.ks_pvalue is not None else "N/A",
            round(fit.ad_statistic, 2) if fit.ad_statistic is not None else "N/A",
            fit.param_shape if fit.param_shape is not None else "N/A",
            round(fit.param_loc, 4),
            round(fit.param_scale, 4),
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=distribution_benchmarks_comparison.csv"}
    )
