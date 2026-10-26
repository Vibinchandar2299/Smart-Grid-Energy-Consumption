"""
Comprehensive system-wide verification test suite.
Validates all endpoints, real data queries, GEV conversions, CSV streaming, and edge cases.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_overview_endpoint():
    response = client.get("/api/v1/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["sample_size"] == 1000000
    assert 14.0 < data["mean_consumption_kwh"] < 15.5
    assert data["highest_consuming_sector"] == "Industrial"


def test_hourly_endpoint():
    response = client.get("/api/v1/hourly")
    assert response.status_code == 200
    data = response.json()
    assert len(data["hourly_profiles"]) == 24
    assert "ratio_peak_to_non_peak" in data


def test_sector_endpoint():
    response = client.get("/api/v1/sectors")
    assert response.status_code == 200
    data = response.json()
    assert len(data["sectors"]) == 5


def test_peak_endpoint():
    response = client.get("/api/v1/peak")
    assert response.status_code == 200
    data = response.json()
    assert data["peak"]["mean_kwh"] > data["non_peak"]["mean_kwh"]


def test_consumption_options():
    response = client.get("/api/v1/consumption/options")
    assert response.status_code == 200
    data = response.json()
    assert "Industrial" in data["sectors"]
    assert 2024 in data["years"]
    assert data["dataset_info"]["total_observations"] == 1000000


def test_consumption_filtering_and_moments():
    # Filter by Sector = Domestic and Year = 2023
    response = client.get("/api/v1/consumption/filter?sector=Domestic&year=2023&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["is_empty"] is False
    assert data["sample_size"] > 0
    stats = data["filtered_statistics"]
    assert stats["count"] == data["sample_size"]
    # Domestic mean should be around ~4.95 kWh
    assert 4.0 < stats["mean"] < 6.0
    assert len(data["records"]) <= 10
    assert all(r["sector"] == "Domestic" and r["year"] == 2023 for r in data["records"])


def test_consumption_high_exceedance_percentile():
    response = client.get("/api/v1/consumption/high-consumption?percentile=99.0&limit=20")
    assert response.status_code == 200
    data = response.json()
    assert data["selected_percentile"] == 99.0
    assert 35.0 < data["calculated_threshold_kwh"] < 38.0
    assert data["exceedance_count"] > 0
    assert len(data["flagged_records"]) <= 20
    assert all(r["energy_consumption_kwh"] > data["calculated_threshold_kwh"] for r in data["flagged_records"])


def test_consumption_csv_export():
    response = client.get("/api/v1/consumption/export-csv?sector=Commercial&year=2022&max_records=50")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    lines = response.text.strip().split("\n")
    assert len(lines) > 1
    assert "id,timestamp,sector,district,year" in lines[0]


def test_distributions_comparison():
    response = client.get("/api/v1/distributions/comparison")
    assert response.status_code == 200
    data = response.json()
    assert data["best_distribution"] == "Log-normal"
    fits = data["distribution_fits"]
    assert len(fits) == 4
    # Check ranking
    assert fits[0]["distribution"] == "Log-normal"
    assert fits[0]["rank"] == 1
    # Check that AD is null / uncomputed
    assert fits[0]["ad_statistic"] is None


def test_distributions_curves_dynamic_resolution():
    response = client.get("/api/v1/distributions/curves?points=80")
    assert response.status_code == 200
    curves = response.json()
    assert len(curves) == 80
    assert "lognormal_pdf" in curves[0]
    assert "weibull_pdf" in curves[0]
    assert "normal_pdf" in curves[0]
    assert "gamma_pdf" in curves[0]


def test_distributions_csv_export():
    response = client.get("/api/v1/distributions/export-csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "distribution,rank,aic,bic" in response.text


def test_extreme_values_daily():
    response = client.get("/api/v1/extreme-values?block_type=daily_maxima")
    assert response.status_code == 200
    data = response.json()
    assert data["block_type"] == "daily_maxima"
    params = data["gev_parameters"]
    assert params["shape_xi"] < 0  # Weibull bounded tail
    assert len(data["return_levels"]) >= 6


def test_extreme_values_monthly_authentic():
    response = client.get("/api/v1/extreme-values?block_type=monthly_maxima")
    assert response.status_code == 200
    data = response.json()
    assert data["block_type"] == "monthly_maxima"
    params = data["gev_parameters"]
    # Authentic GEV fit on 115 months: shape ~ -0.0467
    assert -0.1 < params["shape_xi"] < 0.0
    assert 40.0 < params["loc_mu"] < 50.0
    assert 3.0 < params["scale_sigma"] < 7.0
    assert len(data["return_levels"]) == 5


def test_extreme_values_csv_export():
    response = client.get("/api/v1/extreme-values/export-csv?block_type=monthly_maxima")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "monthly_maxima" in response.text
