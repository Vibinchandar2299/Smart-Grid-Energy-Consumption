"""
Service layer for interactive consumption analysis, filtering, and high-demand detection.
"""
import io
import csv
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.repositories.consumption_repo import ConsumptionRepository


class ConsumptionService:
    def __init__(self, db: Session):
        self.repo = ConsumptionRepository(db)

    def get_filter_options(self) -> Dict[str, Any]:
        """Provides available filter dimensions supported by the authentic dataset."""
        return {
            "sectors": ["All", "Industrial", "Commercial", "Agriculture", "Domestic", "Miscellaneous"],
            "years": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
            "seasons": ["All", "Summer", "Southwest Monsoon", "Northeast Monsoon", "Winter"],
            "hour_bands": ["All", "Night", "Morning", "Afternoon", "Evening"],
            "peak_options": [
                {"label": "All Periods", "value": None},
                {"label": "Peak Windows Only", "value": 1},
                {"label": "Non-Peak Baseline Only", "value": 0},
            ],
            "dataset_info": {
                "coverage_start": "2015-01-01 00:00:00",
                "coverage_end": "2024-07-04 05:00:00",
                "total_observations": 1000000,
                "partial_year_warning": "Year 2024 is partial (January 1 to July 4, 2024).",
            }
        }

    def filter_consumption(
        self,
        sector: Optional[str] = None,
        year: Optional[int] = None,
        month: Optional[int] = None,
        season: Optional[str] = None,
        hour: Optional[int] = None,
        hour_band: Optional[str] = None,
        peak_period: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """Performs dynamic filtering and statistical recalculation."""
        stats = self.repo.get_filtered_statistics(
            sector=sector,
            year=year,
            month=month,
            season=season,
            hour=hour,
            hour_band=hour_band,
            peak_period=peak_period,
            start_date=start_date,
            end_date=end_date,
        )

        records = self.repo.get_filtered_records(
            sector=sector,
            year=year,
            month=month,
            season=season,
            hour=hour,
            hour_band=hour_band,
            peak_period=peak_period,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset,
        )

        hourly_pattern = self.repo.get_filtered_hourly_profile(
            sector=sector,
            year=year,
            month=month,
            season=season,
            peak_period=peak_period,
            start_date=start_date,
            end_date=end_date,
        )

        sector_distribution = self.repo.get_filtered_sector_distribution(
            year=year,
            month=month,
            season=season,
            hour=hour,
            hour_band=hour_band,
            peak_period=peak_period,
            start_date=start_date,
            end_date=end_date,
        )

        filters_summary = {
            "sector": sector or "All",
            "year": year or "All",
            "month": month or "All",
            "season": season or "All",
            "hour": hour if hour is not None else "All",
            "hour_band": hour_band or "All",
            "peak_period": "Peak" if peak_period == 1 else ("Non-Peak" if peak_period == 0 else "All"),
            "start_date": start_date or "2015-01-01",
            "end_date": end_date or "2024-07-04",
        }

        return {
            "filtered_statistics": stats,
            "sample_size": stats["count"],
            "records": records,
            "records_count": len(records),
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total_matching": stats["count"],
            },
            "hourly_pattern": hourly_pattern,
            "sector_distribution": sector_distribution,
            "filters_applied": filters_summary,
            "is_empty": stats["count"] == 0,
        }

    def detect_high_consumption(
        self,
        percentile: float = 99.0,
        sector: Optional[str] = None,
        year: Optional[int] = None,
        month: Optional[int] = None,
        season: Optional[str] = None,
        hour: Optional[int] = None,
        peak_period: Optional[int] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """Calculates statistical high-consumption threshold and flagged exceedances."""
        return self.repo.get_high_consumption_exceedances(
            percentile=percentile,
            sector=sector,
            year=year,
            month=month,
            season=season,
            hour=hour,
            peak_period=peak_period,
            limit=limit,
            offset=offset,
        )

    def export_filtered_csv(
        self,
        sector: Optional[str] = None,
        year: Optional[int] = None,
        month: Optional[int] = None,
        season: Optional[str] = None,
        hour: Optional[int] = None,
        hour_band: Optional[str] = None,
        peak_period: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        max_records: int = 5000,
    ) -> str:
        """Exports filtered consumption observations as a CSV string with correct headers."""
        records = self.repo.get_filtered_records(
            sector=sector,
            year=year,
            month=month,
            season=season,
            hour=hour,
            hour_band=hour_band,
            peak_period=peak_period,
            start_date=start_date,
            end_date=end_date,
            limit=max_records,
            offset=0,
        )

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Record_ID",
            "Timestamp_UTC",
            "Consumer_Sector",
            "District",
            "Year",
            "Month",
            "Season",
            "Hour_24",
            "Peak_Period_Flag",
            "Energy_Consumption_kWh",
        ])

        for r in records:
            writer.writerow([
                r["id"],
                r["timestamp"],
                r["sector"],
                r["district"],
                r["year"],
                r["month"],
                r["season"],
                r["hour"],
                r["peak_period_flag"],
                r["energy_consumption_kwh"],
            ])

        return output.getvalue()
