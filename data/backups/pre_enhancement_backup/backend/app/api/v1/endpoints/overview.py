"""Overview and summary metrics endpoint."""
from fastapi import APIRouter, Depends
from app.api.deps import get_distribution_service, get_segment_service
from app.services.distribution_service import DistributionService
from app.services.segment_service import SegmentService
from app.schemas.common import ApiResponse, ResearchMetadata

router = APIRouter()


@router.get("", response_model=ApiResponse[dict])
def get_overview(
    dist_service: DistributionService = Depends(get_distribution_service),
    seg_service: SegmentService = Depends(get_segment_service),
):
    """Returns top-level research summary metrics and dataset metadata."""
    comparison = dist_service.get_distribution_comparison()
    peak = seg_service.get_peak_analysis()
    sectors = seg_service.get_sector_analysis()

    summary_data = {
        "dataset_name": "Tamil Nadu Synthetic Smart Grid Energy Dataset",
        "primary_metric": "energy_consumption_kwh",
        "sample_size": comparison.descriptive_statistics.count,
        "mean_consumption_kwh": comparison.descriptive_statistics.mean,
        "std_consumption_kwh": comparison.descriptive_statistics.std,
        "best_fit_distribution": comparison.best_distribution,
        "peak_to_non_peak_ratio": peak.ratio_peak_to_non_peak_mean,
        "highest_consuming_sector": sectors.highest_consuming_sector,
        "sectors_count": len(sectors.sectors),
        "status": "Validated Research Deployment Layer",
    }

    return ApiResponse(
        data=summary_data,
        message="Overview metadata and summary statistics retrieved successfully."
    )
