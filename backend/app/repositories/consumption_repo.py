"""
Repository for raw energy consumption records and dynamic aggregation queries.
Executes indexed SQL queries over the 1,000,000 smart meter observations.
"""
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text


class ConsumptionRepository:
    def __init__(self, db: Session):
        self.db = db

    def _build_filter_clause(
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
    ) -> Tuple[str, Dict[str, Any]]:
        """Builds a secure parameterized WHERE clause for raw record filtering."""
        conditions = ["1=1"]
        params: Dict[str, Any] = {}

        if sector and sector.strip() and sector.lower() != "all":
            conditions.append("sector = :sector")
            params["sector"] = sector.strip()

        if year is not None:
            conditions.append("year = :year")
            params["year"] = int(year)

        if month is not None:
            conditions.append("month = :month")
            params["month"] = int(month)

        if season and season.strip() and season.lower() != "all":
            conditions.append("season = :season")
            params["season"] = season.strip()

        if hour is not None:
            conditions.append("hour = :hour")
            params["hour"] = int(hour)

        if hour_band and hour_band.strip() and hour_band.lower() != "all":
            hb = hour_band.strip().lower()
            if hb == "night":
                conditions.append("hour BETWEEN 0 AND 5")
            elif hb == "morning":
                conditions.append("hour BETWEEN 6 AND 11")
            elif hb == "afternoon":
                conditions.append("hour BETWEEN 12 AND 17")
            elif hb == "evening":
                conditions.append("hour BETWEEN 18 AND 23")

        if peak_period is not None:
            conditions.append("peak_period_flag = :peak_period")
            params["peak_period"] = int(peak_period)

        if start_date and start_date.strip():
            try:
                # Validate date format
                datetime.strptime(start_date.strip(), "%Y-%m-%d")
                conditions.append("timestamp >= :start_date")
                params["start_date"] = f"{start_date.strip()} 00:00:00"
            except ValueError:
                pass

        if end_date and end_date.strip():
            try:
                datetime.strptime(end_date.strip(), "%Y-%m-%d")
                conditions.append("timestamp <= :end_date")
                params["end_date"] = f"{end_date.strip()} 23:59:59"
            except ValueError:
                pass

        return " AND ".join(conditions), params

    def get_filtered_statistics(
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
    ) -> Dict[str, Any]:
        """Calculates authentic empirical statistics from the filtered observation subset."""
        where_sql, params = self._build_filter_clause(
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

        query = text(f"""
            SELECT
                COUNT(*) AS count,
                COALESCE(AVG(energy_consumption_kwh), 0.0) AS mean,
                COALESCE(STDDEV_SAMP(energy_consumption_kwh), 0.0) AS std,
                COALESCE(VAR_SAMP(energy_consumption_kwh), 0.0) AS variance,
                COALESCE(MIN(energy_consumption_kwh), 0.0) AS min_val,
                COALESCE(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY energy_consumption_kwh), 0.0) AS q25,
                COALESCE(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY energy_consumption_kwh), 0.0) AS median,
                COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY energy_consumption_kwh), 0.0) AS q75,
                COALESCE(MAX(energy_consumption_kwh), 0.0) AS max_val
            FROM energy_consumption_records
            WHERE {where_sql};
        """)

        row = self.db.execute(query, params).mappings().fetchone()
        if not row or row["count"] == 0:
            return {
                "count": 0,
                "mean": 0.0,
                "std": 0.0,
                "variance": 0.0,
                "min_val": 0.0,
                "q25": 0.0,
                "median": 0.0,
                "q75": 0.0,
                "max_val": 0.0,
                "skewness": 0.0,
                "kurtosis": 0.0,
            }

        cnt = int(row["count"])
        mean = float(row["mean"])
        std = float(row["std"])

        # Compute higher-order moments (skewness, kurtosis) if sample size > 3
        skewness = 0.0
        kurtosis = 0.0
        if cnt > 3 and std > 0:
            moments_query = text(f"""
                SELECT
                    AVG(POWER((energy_consumption_kwh - :mean) / :std, 3)) AS skewness,
                    AVG(POWER((energy_consumption_kwh - :mean) / :std, 4)) - 3.0 AS kurtosis
                FROM energy_consumption_records
                WHERE {where_sql};
            """)
            m_params = {**params, "mean": mean, "std": std}
            m_row = self.db.execute(moments_query, m_params).mappings().fetchone()
            if m_row:
                skewness = round(float(m_row["skewness"] or 0.0), 4)
                kurtosis = round(float(m_row["kurtosis"] or 0.0), 4)

        return {
            "count": cnt,
            "mean": round(mean, 4),
            "std": round(std, 4),
            "variance": round(float(row["variance"]), 4),
            "min_val": round(float(row["min_val"]), 4),
            "q25": round(float(row["q25"]), 4),
            "median": round(float(row["median"]), 4),
            "q75": round(float(row["q75"]), 4),
            "max_val": round(float(row["max_val"]), 4),
            "skewness": skewness,
            "kurtosis": kurtosis,
        }

    def get_filtered_records(
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
    ) -> List[Dict[str, Any]]:
        """Retrieves paginated consumption records matching the active filter criteria."""
        where_sql, params = self._build_filter_clause(
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

        query = text(f"""
            SELECT
                id,
                TO_CHAR(timestamp, 'YYYY-MM-DD HH24:MI:SS') AS timestamp,
                sector,
                district,
                year,
                month,
                season,
                hour,
                peak_period_flag,
                energy_consumption_kwh
            FROM energy_consumption_records
            WHERE {where_sql}
            ORDER BY timestamp DESC
            LIMIT :limit OFFSET :offset;
        """)

        query_params = {**params, "limit": max(1, min(limit, 500)), "offset": max(0, offset)}
        rows = self.db.execute(query, query_params).mappings().fetchall()
        return [dict(r) for r in rows]

    def get_filtered_hourly_profile(
        self,
        sector: Optional[str] = None,
        year: Optional[int] = None,
        month: Optional[int] = None,
        season: Optional[str] = None,
        peak_period: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Aggregates 24-hour diurnal patterns for the filtered subset."""
        where_sql, params = self._build_filter_clause(
            sector=sector,
            year=year,
            month=month,
            season=season,
            peak_period=peak_period,
            start_date=start_date,
            end_date=end_date,
        )

        query = text(f"""
            SELECT
                hour,
                ROUND(AVG(energy_consumption_kwh)::numeric, 2) AS mean_kwh,
                ROUND(STDDEV_SAMP(energy_consumption_kwh)::numeric, 2) AS std_kwh,
                COUNT(*) AS count,
                MODE() WITHIN GROUP (ORDER BY peak_period_flag) AS peak_period_flag
            FROM energy_consumption_records
            WHERE {where_sql}
            GROUP BY hour
            ORDER BY hour ASC;
        """)

        rows = self.db.execute(query, params).mappings().fetchall()
        return [
            {
                "hour": int(r["hour"]),
                "mean_kwh": float(r["mean_kwh"] or 0.0),
                "std_kwh": float(r["std_kwh"] or 0.0),
                "count": int(r["count"]),
                "peak_period_flag": bool(r["peak_period_flag"] == 1),
            }
            for r in rows
        ]

    def get_filtered_sector_distribution(
        self,
        year: Optional[int] = None,
        month: Optional[int] = None,
        season: Optional[str] = None,
        hour: Optional[int] = None,
        hour_band: Optional[str] = None,
        peak_period: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Aggregates sector load intensity and consumption shares."""
        where_sql, params = self._build_filter_clause(
            year=year,
            month=month,
            season=season,
            hour=hour,
            hour_band=hour_band,
            peak_period=peak_period,
            start_date=start_date,
            end_date=end_date,
        )

        query = text(f"""
            SELECT
                sector,
                ROUND(AVG(energy_consumption_kwh)::numeric, 2) AS mean_kwh,
                ROUND(STDDEV_SAMP(energy_consumption_kwh)::numeric, 2) AS std_kwh,
                ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY energy_consumption_kwh)::numeric, 2) AS median_kwh,
                COUNT(*) AS count,
                SUM(energy_consumption_kwh) AS total_kwh
            FROM energy_consumption_records
            WHERE {where_sql}
            GROUP BY sector
            ORDER BY mean_kwh DESC;
        """)

        rows = self.db.execute(query, params).mappings().fetchall()
        total_sum = sum(float(r["total_kwh"] or 0.0) for r in rows)

        return [
            {
                "sector": str(r["sector"]),
                "mean_kwh": float(r["mean_kwh"] or 0.0),
                "std_kwh": float(r["std_kwh"] or 0.0),
                "median_kwh": float(r["median_kwh"] or 0.0),
                "count": int(r["count"]),
                "share_percent": round((float(r["total_kwh"] or 0.0) / total_sum * 100), 2) if total_sum > 0 else 0.0,
            }
            for r in rows
        ]

    def get_high_consumption_exceedances(
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
        """
        Calculates a statistical high-consumption percentile threshold and
        extracts flagged observations exceeding that cutoff.
        """
        p_clamped = max(90.0, min(percentile, 99.9))
        p_fraction = p_clamped / 100.0

        where_sql, params = self._build_filter_clause(
            sector=sector,
            year=year,
            month=month,
            season=season,
            hour=hour,
            peak_period=peak_period,
        )

        # 1. Calculate the exact threshold cutoff
        thresh_query = text(f"""
            SELECT
                COUNT(*) AS total_count,
                PERCENTILE_CONT(:p_frac) WITHIN GROUP (ORDER BY energy_consumption_kwh) AS threshold_kwh
            FROM energy_consumption_records
            WHERE {where_sql};
        """)
        thresh_params = {**params, "p_frac": p_fraction}
        thresh_row = self.db.execute(thresh_query, thresh_params).mappings().fetchone()

        total_ref_count = int(thresh_row["total_count"]) if thresh_row else 0
        threshold_val = float(thresh_row["threshold_kwh"]) if (thresh_row and thresh_row["threshold_kwh"] is not None) else 0.0

        if total_ref_count == 0 or threshold_val == 0.0:
            return {
                "selected_percentile": p_clamped,
                "calculated_threshold_kwh": 0.0,
                "total_reference_count": 0,
                "exceedance_count": 0,
                "exceedance_percentage": 0.0,
                "flagged_records": [],
                "scientific_disclaimer": "No observations found matching the reference population.",
            }

        # 2. Count exceedances
        count_query = text(f"""
            SELECT COUNT(*) AS exc_count
            FROM energy_consumption_records
            WHERE {where_sql} AND energy_consumption_kwh > :thresh;
        """)
        c_params = {**params, "thresh": threshold_val}
        exc_count = int(self.db.execute(count_query, c_params).scalar() or 0)
        exc_pct = round((exc_count / total_ref_count) * 100, 2) if total_ref_count > 0 else 0.0

        # 3. Fetch flagged records
        records_query = text(f"""
            SELECT
                id,
                TO_CHAR(timestamp, 'YYYY-MM-DD HH24:MI:SS') AS timestamp,
                sector,
                district,
                hour,
                peak_period_flag,
                energy_consumption_kwh,
                ROUND((energy_consumption_kwh - :thresh)::numeric, 2) AS exceedance_delta_kwh
            FROM energy_consumption_records
            WHERE {where_sql} AND energy_consumption_kwh > :thresh
            ORDER BY energy_consumption_kwh DESC
            LIMIT :limit OFFSET :offset;
        """)
        r_params = {**params, "thresh": threshold_val, "limit": limit, "offset": offset}
        flagged_rows = self.db.execute(records_query, r_params).mappings().fetchall()

        return {
            "selected_percentile": p_clamped,
            "calculated_threshold_kwh": round(threshold_val, 2),
            "total_reference_count": total_ref_count,
            "exceedance_count": exc_count,
            "exceedance_percentage": exc_pct,
            "flagged_records": [dict(r) for r in flagged_rows],
            "scientific_disclaimer": (
                f"Statistically high demand observations exceeding the {p_clamped}th empirical percentile "
                f"({round(threshold_val, 2)} kWh) calculated over {total_ref_count:,} observations. "
                "These statistical exceedances highlight upper-tail concentration and do not represent confirmed electrical grid faults."
            ),
        }

    def get_authentic_monthly_maxima(self) -> List[Dict[str, Any]]:
        """Extracts monthly block maxima from all 115 chronological calendar months."""
        query = text("""
            SELECT
                TO_CHAR(DATE_TRUNC('month', timestamp), 'YYYY-MM') AS yr_mo,
                MAX(energy_consumption_kwh) AS max_kwh,
                COUNT(*) AS observation_count
            FROM energy_consumption_records
            GROUP BY yr_mo
            ORDER BY yr_mo ASC;
        """)
        rows = self.db.execute(query).mappings().fetchall()
        return [
            {
                "month_cohort": str(r["yr_mo"]),
                "max_kwh": round(float(r["max_kwh"]), 3),
                "count": int(r["observation_count"]),
            }
            for r in rows
        ]

    def get_authentic_daily_maxima(self) -> List[Dict[str, Any]]:
        """Extracts daily block maxima grouped by actual calendar date (3,473 dates)."""
        query = text("""
            SELECT
                DATE(timestamp) AS dt,
                MAX(energy_consumption_kwh) AS max_kwh,
                COUNT(*) AS observation_count
            FROM energy_consumption_records
            GROUP BY DATE(timestamp)
            ORDER BY dt ASC;
        """)
        rows = self.db.execute(query).mappings().fetchall()
        return [
            {
                "date_cohort": str(r["dt"]),
                "max_kwh": round(float(r["max_kwh"]), 3),
                "count": int(r["observation_count"]),
            }
            for r in rows
        ]

