"""
Compute Authentic Descriptive Statistics & Segment Moments
==========================================================
Phase 3A: Computes authentic summary statistics and empirical moments
directly from the verified source dataset:
  C:\\Users\\VIBIN\\Downloads\\tamil_nadu_synthetic_smart_grid_energy_v2_1M.csv

Strict Guarantees:
- Never fabricates missing values or substitutes stale artifact data.
- Preserves the synthetic dataset label and authentic 2015-2024 timestamp range.
- Does not modify frozen_artifacts, database models, or backend services.
- Outputs exclusively into data/staged_artifacts/.
"""
import argparse
import csv
import json
import math
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd


def get_hour_segment(h: int) -> str:
    """Classifies 24-hour diurnal cycle into 4 standard blocks."""
    if 0 <= h <= 5:
        return "Night"
    elif 6 <= h <= 11:
        return "Morning"
    elif 12 <= h <= 17:
        return "Afternoon"
    else:
        return "Evening"


def compute_series_moments(series: pd.Series) -> Dict[str, Any]:
    """Computes exact empirical moments with unbiased sample estimators."""
    cnt = int(series.count())
    if cnt == 0:
        return {}
    mean_val = float(series.mean())
    std_val = float(series.std(ddof=1)) if cnt > 1 else 0.0
    var_val = float(series.var(ddof=1)) if cnt > 1 else 0.0
    min_val = float(series.min())
    q25_val = float(series.quantile(0.25))
    med_val = float(series.median())
    q75_val = float(series.quantile(0.75))
    max_val = float(series.max())
    skew_val = float(series.skew()) if cnt > 2 else 0.0
    kurt_val = float(series.kurt()) if cnt > 3 else 0.0  # Excess kurtosis (Fisher, normal=0)

    return {
        "count": cnt,
        "mean": round(mean_val, 4),
        "std": round(std_val, 4),
        "variance": round(var_val, 4),
        "min": round(min_val, 4),
        "q25": round(q25_val, 4),
        "median": round(med_val, 4),
        "q75": round(q75_val, 4),
        "max": round(max_val, 4),
        "skewness": round(skew_val, 4),
        "kurtosis": round(kurt_val, 4),
    }


def main():
    parser = argparse.ArgumentParser(description="Compute authentic statistics from 1M dataset.")
    parser.add_argument(
        "--dataset-path",
        type=Path,
        default=Path(r"C:\Users\VIBIN\Downloads\tamil_nadu_synthetic_smart_grid_energy_v2_1M.csv"),
        help="Path to the source CSV dataset.",
    )
    parser.add_argument(
        "--staging-dir",
        type=Path,
        default=Path(__file__).resolve().parent.parent.parent / "data" / "staged_artifacts",
        help="Directory to save staged statistical artifacts.",
    )
    args = parser.parse_args()

    dataset_path = args.dataset_path
    staging_dir = args.staging_dir
    staging_dir.mkdir(parents=True, exist_ok=True)

    if not dataset_path.exists():
        raise FileNotFoundError(f"Source dataset not found at: {dataset_path}")

    print(f"Reading dataset: {dataset_path}...")
    df = pd.read_csv(dataset_path)

    # 1. Dataset Inspection
    total_rows = len(df)
    total_cols = len(df.columns)
    col_names = df.columns.tolist()
    missing_by_col = df.isnull().sum().to_dict()
    total_missing = int(df.isnull().sum().sum())
    duplicate_count = int(df.duplicated().sum())

    ts_min = str(df["timestamp"].min())
    ts_max = str(df["timestamp"].max())
    years_present = sorted([int(y) for y in df["year"].unique()])

    ec = df["energy_consumption_kwh"]

    inspection_summary = {
        "dataset_name": "tamil_nadu_synthetic_smart_grid_energy_v2_1M.csv",
        "dataset_classification": "SYNTHETIC_RESEARCH_BENCHMARK_DATASET",
        "description": (
            "Synthetic smart meter energy consumption dataset calibrated to Tamil Nadu grid demand patterns. "
            "Observations are synthetically generated for statistical distribution modeling and are not official utility billing records."
        ),
        "total_records": total_rows,
        "total_columns": total_cols,
        "columns": col_names,
        "missing_values_total": total_missing,
        "duplicate_rows_detected": duplicate_count,
        "timestamp_start": ts_min,
        "timestamp_end": ts_max,
        "temporal_span_years": len(years_present),
        "years_covered": years_present,
        "primary_metric": "energy_consumption_kwh",
    }

    # 2. Overall Population Descriptive Statistics
    print("Computing overall population descriptive statistics...")
    overall_moments = compute_series_moments(ec)
    overall_moments["scope"] = "overall_1M_population"
    overall_moments["dataset_classification"] = inspection_summary["dataset_classification"]
    overall_moments["timestamp_range"] = f"{ts_min} to {ts_max}"

    # Also compute 10k random sample moments with seed=42 for Colab cross-check
    print("Computing seed=42 (10,000 sample) moments for Colab alignment verification...")
    sample_10k = ec.sample(n=10000, random_state=42)
    sample_10k_moments = compute_series_moments(sample_10k)
    sample_10k_moments["scope"] = "sample_10k_seed42"

    # 3. Authentic Segment Statistics
    print("Computing segment empirical moments...")
    df["hour_segment"] = df["hour"].apply(get_hour_segment)

    segments_data: Dict[str, Dict[str, Any]] = {}
    segment_rows_for_csv: List[Dict[str, Any]] = []

    segment_dimensions = [
        ("sector", "sector"),
        ("peak_period_flag", "peak_period"),
        ("season", "season"),
        ("hour_segment", "diurnal_block"),
        ("year", "annual_cohort"),
    ]

    for dim_col, dim_label in segment_dimensions:
        segments_data[dim_col] = {}
        for val, grp in df.groupby(dim_col):
            val_str = str(val)
            s_moments = compute_series_moments(grp["energy_consumption_kwh"])
            s_moments["dimension"] = dim_label
            segments_data[dim_col][val_str] = s_moments

            # Create tabular row
            segment_rows_for_csv.append({
                "segment_dimension": dim_label,
                "segment_type": dim_col,
                "segment_value": val_str,
                "count": s_moments["count"],
                "mean_kwh": s_moments["mean"],
                "std_kwh": s_moments["std"],
                "variance_kwh": s_moments["variance"],
                "min_kwh": s_moments["min"],
                "q25_kwh": s_moments["q25"],
                "median_kwh": s_moments["median"],
                "q75_kwh": s_moments["q75"],
                "max_kwh": s_moments["max"],
                "skewness": s_moments["skewness"],
                "kurtosis": s_moments["kurtosis"],
            })

    # 4. Discrete Hourly Profile (0 to 23 hours)
    hourly_profiles: List[Dict[str, Any]] = []
    for h, grp in df.groupby("hour"):
        h_int = int(h)
        h_moments = compute_series_moments(grp["energy_consumption_kwh"])
        is_peak = bool(grp["peak_period_flag"].mode()[0] == 1)
        hourly_profiles.append({
            "hour": h_int,
            "mean_kwh": h_moments["mean"],
            "std_kwh": h_moments["std"],
            "median_kwh": h_moments["median"],
            "count": h_moments["count"],
            "peak_period_flag": is_peak,
        })

    # 5. Temporal Longitudinal Drift (2015 to 2024)
    temporal_shifts: List[Dict[str, Any]] = []
    base_year_mean = segments_data["year"]["2015"]["mean"]
    for y in years_present:
        y_str = str(y)
        y_moments = segments_data["year"][y_str]
        pct_shift = round(((y_moments["mean"] - base_year_mean) / base_year_mean) * 100, 2)
        temporal_shifts.append({
            "year": y,
            "count": y_moments["count"],
            "mean_kwh": y_moments["mean"],
            "std_kwh": y_moments["std"],
            "median_kwh": y_moments["median"],
            "skewness": y_moments["skewness"],
            "kurtosis": y_moments["kurtosis"],
            "shift_pct_from_2015": pct_shift,
        })

    # 6. Save Staged Artifacts
    # Artifact A: Authentic Overall Descriptive Statistics
    desc_artifact_path = staging_dir / "authentic_descriptive_statistics.json"
    with open(desc_artifact_path, "w", encoding="utf-8") as f:
        json.dump({
            "inspection_metadata": inspection_summary,
            "population_statistics_1M": overall_moments,
            "sample_statistics_10k_seed42": sample_10k_moments,
        }, f, indent=2)
    print(f"Saved: {desc_artifact_path}")

    # Artifact B: Authentic Segment Moments CSV
    seg_csv_path = staging_dir / "authentic_segment_moments.csv"
    with open(seg_csv_path, "w", encoding="utf-8", newline="") as f:
        fieldnames = [
            "segment_dimension", "segment_type", "segment_value", "count",
            "mean_kwh", "std_kwh", "variance_kwh", "min_kwh", "q25_kwh",
            "median_kwh", "q75_kwh", "max_kwh", "skewness", "kurtosis"
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(segment_rows_for_csv)
    print(f"Saved: {seg_csv_path}")

    # Artifact C: Hourly Diurnal Profiles
    hourly_artifact_path = staging_dir / "authentic_diurnal_hourly_profiles.json"
    with open(hourly_artifact_path, "w", encoding="utf-8") as f:
        json.dump({
            "description": "Authentic 24-hour diurnal profile computed from 1,000,000 observations.",
            "hourly_profiles": hourly_profiles,
        }, f, indent=2)
    print(f"Saved: {hourly_artifact_path}")

    # Artifact D: Temporal Longitudinal Shifts
    temporal_artifact_path = staging_dir / "authentic_temporal_shift_yearly.json"
    with open(temporal_artifact_path, "w", encoding="utf-8") as f:
        json.dump({
            "description": "Authentic multi-year temporal consumption shifts across 2015-2024 cohorts.",
            "baseline_year": 2015,
            "shifts": temporal_shifts,
        }, f, indent=2)
    print(f"Saved: {temporal_artifact_path}")

    # Artifact E: Update Staged distribution_results.json with Authentic Descriptive Stats
    # Safely integrates the authentic descriptive statistics into the staged file without fabricating
    staged_dist_json_path = staging_dir / "distribution_results.json"
    if staged_dist_json_path.exists():
        with open(staged_dist_json_path, "r", encoding="utf-8") as f:
            staged_dj = json.load(f)

        staged_dj["descriptive_statistics"] = {
            "count": overall_moments["count"],
            "mean": overall_moments["mean"],
            "std": overall_moments["std"],
            "variance": overall_moments["variance"],
            "min": overall_moments["min"],
            "q25": overall_moments["q25"],
            "median": overall_moments["median"],
            "q75": overall_moments["q75"],
            "max": overall_moments["max"],
            "skewness": overall_moments["skewness"],
            "kurtosis": overall_moments["kurtosis"],
            "source": "authentic_1M_population_calculation",
            "verified": True,
        }

        with open(staged_dist_json_path, "w", encoding="utf-8") as f:
            json.dump(staged_dj, f, indent=2)
        print(f"Updated staged distribution_results.json with authentic descriptive statistics.")

    # Artifact F: Update Staged segment_statistics.csv with Authentic Moments
    staged_seg_csv_path = staging_dir / "segment_statistics.csv"
    if staged_seg_csv_path.exists():
        with open(staged_seg_csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            existing_seg_rows = list(reader)

        # Merge authentic moments into existing parameter rows
        for row in existing_seg_rows:
            st = row["segment_type"]
            sv = row["segment_value"]
            if st in segments_data and sv in segments_data[st]:
                mom = segments_data[st][sv]
                row["count"] = mom["count"]
                row["mean_kwh"] = mom["mean"]
                row["std_kwh"] = mom["std"]
                row["median_kwh"] = mom["median"]
                row["min_kwh"] = mom["min"]
                row["max_kwh"] = mom["max"]
                row["skewness"] = mom["skewness"]
                row["kurtosis"] = mom["kurtosis"]

        with open(staged_seg_csv_path, "w", encoding="utf-8", newline="") as f:
            fieldnames = [
                "segment_type", "segment_value", "count", "mean_kwh", "std_kwh",
                "median_kwh", "min_kwh", "max_kwh", "skewness", "kurtosis",
                "best_fit_dist", "dist_shape", "dist_loc", "dist_scale",
                "aic", "bic", "ks_stat", "ks_pvalue"
            ]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(existing_seg_rows)
        print(f"Updated staged segment_statistics.csv with authentic empirical moments.")

    print("\nPhase 3A authentic statistics calculation finished successfully.")


if __name__ == "__main__":
    main()
