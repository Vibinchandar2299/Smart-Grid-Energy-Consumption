"""
Test suite for consumption analysis, filtering, high-consumption detection,
authentic monthly maxima, and CSV exports.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_consumption_options_endpoint():
    res = client.get("/api/v1/consumption/options")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "sectors" in data
    assert "Industrial" in data["sectors"]
    assert "years" in data
    assert 2015 in data["years"]
    assert 2024 in data["years"]
    assert "dataset_info" in data
    assert data["dataset_info"]["total_observations"] == 1000000


def test_consumption_filter_overall():
    res = client.get("/api/v1/consumption/filter?limit=10")
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["sample_size"] == 1000000
    stats = data["filtered_statistics"]
    assert pytest.approx(stats["mean"], rel=1e-3) == 14.7378
    assert pytest.approx(stats["std"], rel=1e-3) == 9.7060
    assert len(data["records"]) == 10
    assert len(data["hourly_pattern"]) == 24
    assert len(data["sector_distribution"]) == 5


def test_consumption_filter_by_sector_and_year():
    # Filter for Industrial sector in year 2023
    res = client.get("/api/v1/consumption/filter?sector=Industrial&year=2023&limit=5")
    assert res.status_code == 200
    data = res.json()["data"]

    stats = data["filtered_statistics"]
    assert stats["count"] == 41490
    assert pytest.approx(stats["mean"], rel=1e-2) == 26.93
    assert len(data["records"]) == 5
    for r in data["records"]:
        assert r["sector"] == "Industrial"
        assert r["year"] == 2023


def test_consumption_filter_empty_state():
    # Filter with an impossible combination
    res = client.get("/api/v1/consumption/filter?sector=Industrial&year=2015&season=Summer&month=12")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["sample_size"] == 0
    assert data["is_empty"] is True
    assert len(data["records"]) == 0


def test_high_consumption_detection():
    # Request 99th percentile cutoff
    res = client.get("/api/v1/consumption/high-consumption?percentile=99.0&limit=10")
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["selected_percentile"] == 99.0
    assert data["total_reference_count"] == 1000000
    assert pytest.approx(data["calculated_threshold_kwh"], rel=1e-2) == 36.55
    assert data["exceedance_count"] > 0
    # Exactly around ~1% of records exceed the 99th percentile
    assert 0.5 <= data["exceedance_percentage"] <= 1.5
    assert len(data["flagged_records"]) == 10

    # Ensure every flagged record is strictly greater than the threshold
    threshold = data["calculated_threshold_kwh"]
    for rec in data["flagged_records"]:
        assert rec["energy_consumption_kwh"] >= threshold


def test_consumption_csv_export():
    res = client.get("/api/v1/consumption/export-csv?sector=Domestic&year=2024&max_records=20")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "attachment;" in res.headers["content-disposition"]
    content = res.text
    lines = content.strip().split("\n")
    assert len(lines) >= 2  # Header + records
    assert "Record_ID,Timestamp_UTC,Consumer_Sector" in lines[0]


def test_distribution_csv_export():
    res = client.get("/api/v1/distributions/export-csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    content = res.text
    assert "Rank,Distribution,AIC,BIC" in content
    assert "Log-normal" in content


def test_extreme_values_monthly_maxima_authentic():
    res = client.get("/api/v1/extreme-values?block_type=monthly_maxima")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["block_type"] == "monthly_maxima"
    gev = data["gev_parameters"]
    assert gev["shape_xi"] < 0  # Bounded tail Weibull domain
    assert "Weibull" in gev["domain_type"]
    return_levels = data["return_levels"]
    assert len(return_levels) == 6
    assert return_levels[0]["sample_maxima_count"] == 115  # 115 calendar months


def test_extreme_values_csv_export():
    res = client.get("/api/v1/extreme-values/export-csv?block_type=daily_maxima")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    content = res.text
    assert "Block_Type,Sample_Maxima_Count,GEV_Shape_xi" in content
