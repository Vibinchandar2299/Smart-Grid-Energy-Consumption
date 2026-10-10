"""
Artifact seed loader:
Ingests frozen Colab research artifacts from data/frozen_artifacts into PostgreSQL.
Adheres strictly to the CORE RULE: distributions are NEVER refitted at runtime.
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


def load_frozen_artifacts_into_db(db: Session) -> bool:
    """
    Checks if PostgreSQL tables already contain the frozen research results.
    If empty, parses the frozen JSON/CSV artifacts and seeds the database.
    """
    artifacts_dir: Path = settings.ARTIFACTS_DIR
    if not artifacts_dir.exists():
        logger.warning(f"Artifacts directory {artifacts_dir} does not exist.")
        return False

    try:
        # 1. Seed Distribution Fits & Descriptive Statistics
        existing_fits = db.query(DistributionFit).count()
        dist_json_path = artifacts_dir / "distribution_results.json"

        if existing_fits == 0 and dist_json_path.exists():
            with open(dist_json_path, "r", encoding="utf-8") as f:
                dist_data = json.load(f)

            # Descriptive statistics
            desc = dist_data.get("descriptive_statistics", {})
            if desc and db.query(DescriptiveStatistic).count() == 0:
                desc_obj = DescriptiveStatistic(
                    scope="overall",
                    count=desc["count"],
                    mean=desc["mean"],
                    std=desc["std"],
                    variance=desc["variance"],
                    min_val=desc["min"],
                    q25=desc["q25"],
                    median=desc["median"],
                    q75=desc["q75"],
                    max_val=desc["max"],
                    skewness=desc["skewness"],
                    kurtosis=desc["kurtosis"],
                )
                db.add(desc_obj)

            # Distribution fits
            fits = dist_data.get("distribution_fits", [])
            for item in fits:
                params = item.get("parameters", {})
                fit_obj = DistributionFit(
                    distribution=item["distribution"],
                    param_shape=params.get("s") or params.get("a") or params.get("c"),
                    param_loc=params.get("loc", 0.0),
                    param_scale=params.get("scale", 1.0),
                    aic=item["aic"],
                    bic=item["bic"],
                    ks_statistic=item["ks_statistic"],
                    ks_pvalue=item["ks_pvalue"],
                    ad_statistic=item["ad_statistic"],
                    rank=item["rank"],
                    parameters_json=params,
                )
                db.add(fit_obj)

            logger.info("Successfully seeded distribution fits from JSON artifact.")

        # 2. Seed Segment Statistics
        existing_segments = db.query(SegmentStatistic).count()
        segment_csv_path = artifacts_dir / "segment_statistics.csv"

        if existing_segments == 0 and segment_csv_path.exists():
            df_seg = pd.read_csv(segment_csv_path)
            for _, row in df_seg.iterrows():
                seg_obj = SegmentStatistic(
                    segment_type=str(row["segment_type"]),
                    segment_value=str(row["segment_value"]),
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
            logger.info("Successfully seeded segment statistics from CSV artifact.")

        # 3. Seed Extreme Value Results
        existing_ev = db.query(ExtremeValueResult).count()
        ev_csv_path = artifacts_dir / "extreme_value_results.csv"

        if existing_ev == 0 and ev_csv_path.exists():
            df_ev = pd.read_csv(ev_csv_path)
            for _, row in df_ev.iterrows():
                ev_obj = ExtremeValueResult(
                    block_type=str(row["block_type"]),
                    sample_maxima_count=int(row["sample_maxima_count"]),
                    shape_xi=float(row["shape_xi"]),
                    loc_mu=float(row["loc_mu"]),
                    scale_sigma=float(row["scale_sigma"]),
                    return_period_years=int(row["return_period_years"]),
                    return_level_kwh=float(row["return_level_kwh"]),
                    ci_lower_95=float(row["ci_lower_95"]),
                    ci_upper_95=float(row["ci_upper_95"]),
                )
                db.add(ev_obj)
            logger.info("Successfully seeded extreme value results from CSV artifact.")

        db.commit()
        return True

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database from artifacts: {e}")
        return False
