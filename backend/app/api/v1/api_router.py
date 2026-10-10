"""API v1 Router aggregating all research section endpoints."""
from fastapi import APIRouter
from app.api.v1.endpoints import (
    overview,
    distributions,
    sectors,
    peak_analysis,
    seasonal,
    hourly,
    temporal_shift,
    extreme_values,
)

api_router = APIRouter()

api_router.include_router(overview.router, prefix="/overview", tags=["Overview"])
api_router.include_router(distributions.router, prefix="/distributions", tags=["Distribution Analysis"])
api_router.include_router(sectors.router, prefix="/sectors", tags=["Sector Analysis"])
api_router.include_router(peak_analysis.router, prefix="/peak", tags=["Peak vs Non-Peak Analysis"])
api_router.include_router(seasonal.router, prefix="/seasonal", tags=["Seasonal Analysis"])
api_router.include_router(hourly.router, prefix="/hourly", tags=["Hourly Analysis"])
api_router.include_router(temporal_shift.router, prefix="/temporal-shift", tags=["Temporal Shift"])
api_router.include_router(extreme_values.router, prefix="/extreme-values", tags=["Extreme Value Analysis"])
