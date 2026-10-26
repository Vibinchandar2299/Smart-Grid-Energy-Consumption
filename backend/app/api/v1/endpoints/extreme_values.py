"""Extreme value analysis and GEV return levels endpoint."""
import io
import csv
from fastapi import APIRouter, Depends, Query, Response
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
    and return level projections on block maxima (daily or monthly).
    """
    data = service.get_extreme_value_analysis(block_type=block_type)
    return ApiResponse(
        data=data,
        message="Extreme value analysis and return levels retrieved successfully."
    )


@router.get("/export-csv")
def export_extreme_values_csv(
    block_type: str = Query(default="daily_maxima", pattern="^(daily_maxima|monthly_maxima)$"),
    service: ExtremeValueService = Depends(get_extreme_value_service),
):
    """Exports GEV return level estimates and parameters as a CSV file."""
    data = service.get_extreme_value_analysis(block_type=block_type)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Block_Type",
        "Sample_Maxima_Count",
        "GEV_Shape_xi",
        "GEV_Location_mu_kWh",
        "GEV_Scale_sigma_kWh",
        "Domain_Type",
        "Return_Period_Days",
        "Return_Period_Years",
        "Estimated_Return_Level_kWh",
        "Reciprocal_Frequency_Rate",
    ])

    for item in data.return_levels:
        writer.writerow([
            item.block_type,
            item.sample_maxima_count,
            round(item.shape_xi, 6),
            round(item.loc_mu, 4),
            round(item.scale_sigma, 4),
            data.gev_parameters.domain_type,
            item.return_period_days if item.return_period_days is not None else "N/A",
            item.return_period_years if item.return_period_years is not None else "N/A",
            round(item.return_level_kwh, 2),
            round(item.reciprocal_rate, 6) if item.reciprocal_rate is not None else "N/A",
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=extreme_value_{block_type}_results.csv"}
    )
