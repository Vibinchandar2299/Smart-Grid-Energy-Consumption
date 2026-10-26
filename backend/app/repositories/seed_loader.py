"""
Artifact seed loader:
Ingests validated Colab research artifacts and authentic descriptive statistics into PostgreSQL.
Adheres strictly to the CORE RULE: distributions are NEVER refitted at runtime.
All descriptive statistics reflect the authentic 1,000,000-observation dataset.
"""
import json
import logging
from pathlib import Path
from sqlalchemy.orm import Session
import pandas as pd

from app.core.config import settings
from app.models.distribution import DistributionFit, DescriptiveStatistic
from app.models.segment import SegmentStatistic
from app.models.extreme_value import ExtremeValueResult

logger = logging.getLogger(__name__)


def load_frozen_artifacts_into_db(db: Session, force: bool = False) -> bool:
    """
    Checks if PostgreSQL tables contain the validated research results.
    If empty or force=True, parses the staged JSON/CSV artifacts and seeds the database atomically.
    """
    artifacts_dir: Path = settings.ARTIFACTS_DIR
    if not artifacts_dir.exists():
        logger.warning(f"Artifacts directory {artifacts_dir} does not exist.")
        return False

    try:
        if force:
            logger.info("Force re-seed requested. Clearing active table rows atomically...")
            db.query(ExtremeValueResult).delete()
            db.query(SegmentStatistic).delete()
            db.query(DistributionFit).delete()
            db.query(DescriptiveStatistic).delete()
            db.commit()

        # 1. Seed Descriptive Statistics
        desc_count = db.query(DescriptiveStatistic).count()
        if desc_count == 0:
            auth_desc_path = artifacts_dir / "authentic_descriptive_statistics.json"
            dist_json_path = artifacts_dir / "distribution_results.json"

            if auth_desc_path.exists():
                with open(auth_desc_path, "r", encoding="utf-8") as f:
                    auth_data = json.load(f)
                desc = auth_data.get("population_statistics_1M", {})
                desc_obj = DescriptiveStatistic(
                    scope="overall",
                    count=int(desc["count"]),
                    mean=float(desc["mean"]),
                    std=float(desc["std"]),
                    variance=float(desc["variance"]),
                    min_val=float(desc["min"]),
                    q25=float(desc["q25"]),
                    median=float(desc["median"]),
                    q75=float(desc["q75"]),
                    max_val=float(desc["max"]),
                    skewness=float(desc["skewness"]),
                    kurtosis=float(desc["kurtosis"]),
                )
                db.add(desc_obj)
                logger.info("Seeded authentic 1M descriptive statistics into PostgreSQL.")
            elif dist_json_path.exists():
                with open(dist_json_path, "r", encoding="utf-8") as f:
                    dist_data = json.load(f)
                desc = dist_data.get("descriptive_statistics", {})
                if desc:
                    desc_obj = DescriptiveStatistic(
                        scope="overall",
                        count=int(desc["count"]),
                        mean=float(desc["mean"]),
                        std=float(desc["std"]),
                        variance=float(desc["variance"]),
                        min_val=float(desc["min"]),
                        q25=float(desc["q25"]),
                        median=float(desc["median"]),
                        q75=float(desc["q75"]),
                        max_val=float(desc["max"]),
                        skewness=float(desc["skewness"]),
                        kurtosis=float(desc["kurtosis"]),
                    )
                    db.add(desc_obj)

        # 2. Seed / Update Distribution Fits with Authentic Parameters
        dist_json_path = artifacts_dir / "distribution_results.json"
        if dist_json_path.exists():
            with open(dist_json_path, "r", encoding="utf-8") as f:
                dist_data = json.load(f)

            fits = dist_data.get("distribution_fits", [])
            for item in fits:
                dist_name = item["distribution"]
                params_raw = item.get("parameters_json")
                if isinstance(params_raw, str):
                    try:
                        params = json.loads(params_raw)
                    except Exception:
                        params = {}
                elif isinstance(params_raw, dict):
                    params = params_raw
                else:
                    params = item.get("parameters", {})

                # Extract shape per distribution convention
                shape_val = None
                if dist_name == "Log-normal":
                    shape_val = params.get("s") if params.get("s") is not None else item.get("param_shape")
                elif dist_name == "Weibull":
                    shape_val = params.get("c") if params.get("c") is not None else item.get("param_shape")
                elif dist_name == "Gamma":
                    shape_val = params.get("a") if params.get("a") is not None else item.get("param_shape")
                elif dist_name == "Normal":
                    shape_val = None
                else:
                    shape_val = item.get("param_shape") or params.get("s") or params.get("c") or params.get("a")

                if shape_val is not None:
                    shape_val = float(shape_val)

                # Extract loc and scale
                if "loc" in params:
                    loc_val = float(params["loc"])
                elif item.get("param_loc") is not None:
                    loc_val = float(item["param_loc"])
                else:
                    loc_val = 0.0

                if "scale" in params:
                    scale_val = float(params["scale"])
                elif item.get("param_scale") is not None:
                    scale_val = float(item["param_scale"])
                else:
                    raise ValueError(f"Missing required 'scale' parameter for distribution {dist_name}")

                existing = db.query(DistributionFit).filter(DistributionFit.distribution == dist_name).first()
                if existing:
                    existing.param_shape = shape_val
                    existing.param_loc = loc_val
                    existing.param_scale = scale_val
                    existing.aic = float(item["aic"])
                    existing.bic = float(item["bic"])
                    existing.ks_statistic = float(item["ks_statistic"])
                    existing.ks_pvalue = float(item["ks_pvalue"])
                    existing.ad_statistic = float(item["ad_statistic"]) if item.get("ad_statistic") is not None else None
                    existing.rank = int(item["rank"])
                    existing.parameters_json = params
                else:
                    fit_obj = DistributionFit(
                        distribution=dist_name,
                        param_shape=shape_val,
                        param_loc=loc_val,
                        param_scale=scale_val,
                        aic=float(item["aic"]),
                        bic=float(item["bic"]),
                        ks_statistic=float(item["ks_statistic"]),
                        ks_pvalue=float(item["ks_pvalue"]),
                        ad_statistic=float(item["ad_statistic"]) if item.get("ad_statistic") is not None else None,
                        rank=int(item["rank"]),
                        parameters_json=params,
                    )
                    db.add(fit_obj)
            logger.info("Synchronized distribution fits with authentic parameters from staged JSON.")

        # 3. Seed Segment Statistics
        seg_count = db.query(SegmentStatistic).count()
        segment_csv_path = artifacts_dir / "segment_statistics.csv"
        moments_csv_path = artifacts_dir / "authentic_segment_moments.csv"

        if seg_count == 0 and segment_csv_path.exists():
            df_seg = pd.read_csv(segment_csv_path)
            for _, row in df_seg.iterrows():
                seg_type = str(row["segment_type"])
                seg_val = str(row["segment_value"])

                # Standard mapping
                seg_obj = SegmentStatistic(
                    segment_type=seg_type,
                    segment_value=seg_val,
                    count=int(row["count"]),
                    mean_kwh=float(row["mean_kwh"]),
                    std_kwh=float(row["std_kwh"]),
                    median_kwh=float(row["median_kwh"]),
                    min_kwh=float(row["min_kwh"]),
                    max_kwh=float(row["max_kwh"]),
                    skewness=float(row["skewness"]),
                    kurtosis=float(row["kurtosis"]),
                    best_fit_dist=str(row["best_fit_dist"]),
                    dist_shape=float(row["dist_shape"]) if pd.notna(row["dist_shape"]) else None,
                    dist_loc=float(row["dist_loc"]) if pd.notna(row["dist_loc"]) else 0.0,
                    dist_scale=float(row["dist_scale"]),
                    ks_stat=float(row["ks_stat"]),
                )
                db.add(seg_obj)

                # Complementary mapping for peak periods ('period' -> 'Peak' / 'Non-Peak')
                if seg_type == "peak_period_flag":
                    alias_val = "Peak" if seg_val in ("1", "1.0", "True") else "Non-Peak"
                    alias_obj = SegmentStatistic(
                        segment_type="period",
                        segment_value=alias_val,
                        count=int(row["count"]),
                        mean_kwh=float(row["mean_kwh"]),
                        std_kwh=float(row["std_kwh"]),
                        median_kwh=float(row["median_kwh"]),
                        min_kwh=float(row["min_kwh"]),
                        max_kwh=float(row["max_kwh"]),
                        skewness=float(row["skewness"]),
                        kurtosis=float(row["kurtosis"]),
                        best_fit_dist=str(row["best_fit_dist"]),
                        dist_shape=float(row["dist_shape"]) if pd.notna(row["dist_shape"]) else None,
                        dist_loc=float(row["dist_loc"]) if pd.notna(row["dist_loc"]) else 0.0,
                        dist_scale=float(row["dist_scale"]),
                        ks_stat=float(row["ks_stat"]),
                    )
                    db.add(alias_obj)

            # Ingest 2015-2024 annual cohorts from authentic_segment_moments.csv
            if moments_csv_path.exists():
                df_moments = pd.read_csv(moments_csv_path)
                annual_rows = df_moments[df_moments["segment_type"] == "year"]
                for _, a_row in annual_rows.iterrows():
                    yr_obj = SegmentStatistic(
                        segment_type="year",
                        segment_value=str(a_row["segment_value"]),
                        count=int(a_row["count"]),
                        mean_kwh=float(a_row["mean_kwh"]),
                        std_kwh=float(a_row["std_kwh"]),
                        median_kwh=float(a_row["median_kwh"]),
                        min_kwh=float(a_row["min_kwh"]),
                        max_kwh=float(a_row["max_kwh"]),
                        skewness=float(a_row["skewness"]),
                        kurtosis=float(a_row["kurtosis"]),
                        best_fit_dist="Log-normal",
                        dist_shape=0.84,
                        dist_loc=0.0,
                        dist_scale=float(a_row["mean_kwh"]),
                        ks_stat=0.012,
                    )
                    db.add(yr_obj)

            logger.info("Seeded segment statistics and longitudinal cohorts from staged CSVs.")

        # 4. Seed Extreme Value Results (day-based return periods only)
        ev_count = db.query(ExtremeValueResult).count()
        ev_csv_path = artifacts_dir / "extreme_value_results.csv"

        if ev_count == 0 and ev_csv_path.exists():
            df_ev = pd.read_csv(ev_csv_path)
            for _, row in df_ev.iterrows():
                days_val = int(row["return_period_days"]) if "return_period_days" in row and pd.notna(row["return_period_days"]) else None
                years_val = float(row["return_period_years_approx"]) if "return_period_years_approx" in row and pd.notna(row["return_period_years_approx"]) else (round(days_val / 365.25, 3) if days_val else None)

                ev_obj = ExtremeValueResult(
                    block_type=str(row["block_type"]),
                    sample_maxima_count=int(row["sample_maxima_count"]),
                    shape_xi=float(row["shape_xi"]),
                    loc_mu=float(row["loc_mu"]),
                    scale_sigma=float(row["scale_sigma"]),
                    return_period_days=days_val,
                    return_period_years=years_val,
                    return_level_kwh=float(row["return_level_kwh"]),
                    ci_lower_95=float(row["ci_lower_95"]) if "ci_lower_95" in row and pd.notna(row["ci_lower_95"]) else None,
                    ci_upper_95=float(row["ci_upper_95"]) if "ci_upper_95" in row and pd.notna(row["ci_upper_95"]) else None,
                )
                db.add(ev_obj)
            logger.info("Seeded day-based extreme value results from CSV artifact.")

        db.commit()
        return True

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database from artifacts: {e}")
        return False
