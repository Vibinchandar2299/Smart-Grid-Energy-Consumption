"""
Test suite for FastAPI endpoints, schema contracts, and acceptance values.
Safeguards 3, 5 verification.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_and_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_overview_endpoint():
    res = client.get("/api/v1/overview")
    assert res.status_code == 200
    data = res.json()["data"]

    # 1. Sample size 1,000,000
    assert data["sample_size"] == 1000000
    # 2. Empirical mean approximately 14.7378 kWh
    assert pytest.approx(data["mean_consumption_kwh"], rel=1e-3) == 14.7378
    assert pytest.approx(data["std_consumption_kwh"], rel=1e-3) == 9.7060
    # 3. Peak to non-peak ratio approximately 1.155x
    assert pytest.approx(data["peak_to_non_peak_ratio"], abs=0.01) == 1.155
    # 4. Five sectors
    assert data["sectors_count"] == 5
    assert data["highest_consuming_sector"] == "Industrial"
    assert data["best_fit_distribution"] == "Log-normal"


def test_distribution_compare_endpoint():
    res = client.get("/api/v1/distributions/compare")
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["best_distribution"] == "Log-normal"
    desc = data["descriptive_statistics"]
    assert desc["count"] == 1000000
    assert pytest.approx(desc["mean"], rel=1e-3) == 14.7378

    fits = data["distribution_fits"]
    assert len(fits) == 4
    # Ensure AD statistic is null/None in contract
    for f in fits:
        assert f["ad_statistic"] is None


def test_distribution_curves_endpoint():
    res = client.get("/api/v1/distributions/curves?points=50")
    assert res.status_code == 200
    pts = res.json()["data"]
    assert len(pts) == 50
    # Check that x coordinates and pdfs are valid numbers
    assert pts[0]["x"] >= 1.0
    for p in pts:
        assert p["normal_pdf"] is not None
        assert p["lognormal_pdf"] is not None


def test_sector_analysis_endpoint():
    res = client.get("/api/v1/sectors")
    assert res.status_code == 200
    data = res.json()["data"]

    sectors = data["sectors"]
    assert len(sectors) == 5
    sector_map = {s["segment_value"]: s for s in sectors}

    # Verify sector moments
    assert pytest.approx(sector_map["Industrial"]["mean_kwh"], rel=1e-2) == 25.50
    assert pytest.approx(sector_map["Commercial"]["mean_kwh"], rel=1e-2) == 12.42
    assert pytest.approx(sector_map["Agriculture"]["mean_kwh"], rel=1e-2) == 9.82
    assert pytest.approx(sector_map["Miscellaneous"]["mean_kwh"], rel=1e-2) == 7.51
    assert pytest.approx(sector_map["Domestic"]["mean_kwh"], rel=1e-2) == 4.95

    assert data["highest_consuming_sector"] == "Industrial"
    assert data["highest_volatility_sector"] == "Industrial"


def test_peak_analysis_endpoint():
    res = client.get("/api/v1/peak")
    assert res.status_code == 200
    data = res.json()["data"]

    # Peak mean 15.9862, non-peak mean 13.8462, ratio ~ 1.155x
    assert pytest.approx(data["ratio_peak_to_non_peak_mean"], abs=0.01) == 1.155
    assert pytest.approx(data["peak"]["mean_kwh"], rel=1e-3) == 15.9862
    assert pytest.approx(data["non_peak"]["mean_kwh"], rel=1e-3) == 13.8462


def test_hourly_profiles_endpoint():
    res = client.get("/api/v1/hourly")
    assert res.status_code == 200
    data = res.json()["data"]

    profiles = data["hourly_profiles"]
    assert len(profiles) == 24
    hours = [p["hour"] for p in profiles]
    assert hours == list(range(24))


def test_temporal_shift_endpoint():
    res = client.get("/api/v1/temporal-shift")
    assert res.status_code == 200
    data = res.json()["data"]

    shifts = data["shifts"]
    assert len(shifts) == 10
    years = [s["year"] for s in shifts]
    assert years == list(range(2015, 2025))

    # 2015 base year (shift = 0.0%)
    assert shifts[0]["year"] == 2015
    assert pytest.approx(shifts[0]["shift_percentage"], abs=0.01) == 0.0
    assert pytest.approx(shifts[0]["mean_kwh"], rel=1e-3) == 13.6715

    # 2024 partial year (shift ~ +20.21%)
    assert shifts[-1]["year"] == 2024
    assert pytest.approx(shifts[-1]["shift_percentage"], abs=0.5) == 20.21
    assert pytest.approx(shifts[-1]["mean_kwh"], rel=1e-3) == 16.4345


def test_extreme_values_endpoint():
    # Query active daily_maxima
    res = client.get("/api/v1/extreme-values?block_type=daily_maxima")
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["block_type"] == "daily_maxima"
    gev = data["gev_parameters"]
    assert pytest.approx(gev["shape_xi"], rel=1e-3) == -0.044268
    assert "Weibull" in gev["domain_type"]

    return_levels = data["return_levels"]
    assert len(return_levels) == 6

    days = [r["return_period_days"] for r in return_levels]
    assert days == [7, 30, 90, 180, 365, 730]

    # Verify no fabricated CIs appear in active analysis
    for r in return_levels:
        assert r["ci_lower_95"] is None
        assert r["ci_upper_95"] is None
        assert r["daily_exceedance_rate"] is not None
        assert pytest.approx(r["daily_exceedance_rate"], rel=1e-4) == 1.0 / r["return_period_days"]
