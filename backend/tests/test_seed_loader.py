"""
Test suite for database seed loader and artifact ingestion integrity.
Safeguards 1, 3, 4, 5 verification.
"""
import pytest
from app.db.session import SessionLocal
from app.repositories.seed_loader import load_frozen_artifacts_into_db
from app.models.distribution import DescriptiveStatistic, DistributionFit
from app.models.segment import SegmentStatistic
from app.models.extreme_value import ExtremeValueResult


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()


def test_seed_loader_idempotence(db_session):
    """Verifies that running seed loader multiple times is safe and maintains counts."""
    # Run seed loader (force=False should preserve existing)
    seeded_again = load_frozen_artifacts_into_db(db_session, force=False)
    assert seeded_again is True

    # Check record counts
    desc_count = db_session.query(DescriptiveStatistic).count()
    assert desc_count == 1

    fits_count = db_session.query(DistributionFit).count()
    assert fits_count == 4

    segs_count = db_session.query(SegmentStatistic).count()
    assert segs_count == 27

    ev_count = db_session.query(ExtremeValueResult).count()
    assert ev_count == 6


def test_authentic_descriptive_statistics(db_session):
    """Verifies population moments match the authentic 1,000,000 observations."""
    desc = db_session.query(DescriptiveStatistic).filter(DescriptiveStatistic.scope == "overall").first()
    assert desc is not None
    assert desc.count == 1000000
    assert pytest.approx(desc.mean, rel=1e-3) == 14.7378
    assert pytest.approx(desc.std, rel=1e-3) == 9.7060
    assert pytest.approx(desc.variance, rel=1e-3) == 94.2057
    assert pytest.approx(desc.min_val, rel=1e-2) == 1.84
    assert pytest.approx(desc.max_val, rel=1e-2) == 66.745
    assert pytest.approx(desc.median, rel=1e-2) == 10.894
    assert pytest.approx(desc.q25, rel=1e-2) == 5.99
    assert pytest.approx(desc.q75, rel=1e-2) == 23.415
    assert pytest.approx(desc.skewness, rel=1e-2) == 0.5407
    assert pytest.approx(desc.kurtosis, rel=1e-2) == -0.9905


def test_distribution_fits_provenance_and_null_ad(db_session):
    """Verifies Log-normal is rank #1 and AD statistic is null (uncomputed)."""
    fits = db_session.query(DistributionFit).order_by(DistributionFit.rank.asc()).all()
    assert len(fits) == 4
    assert fits[0].distribution == "Log-normal"
    assert fits[0].rank == 1

    # In Colab exports, AD statistic was uncomputed and must remain None
    for f in fits:
        assert f.ad_statistic is None, f"AD statistic for {f.distribution} must be None (not fabricated)"


def test_segment_statistics_sectors_and_cohorts(db_session):
    """Verifies five demand sectors and 2015-2024 annual cohorts."""
    # 5 sectors
    sectors = db_session.query(SegmentStatistic).filter(SegmentStatistic.segment_type == "sector").all()
    assert len(sectors) == 5
    sector_names = {s.segment_value for s in sectors}
    assert sector_names == {"Agriculture", "Commercial", "Domestic", "Industrial", "Miscellaneous"}

    # Sector total observations must sum to 1,000,000
    total_sector_obs = sum(s.count for s in sectors)
    assert total_sector_obs == 1000000

    # 10 annual cohorts (2015-2024)
    years = db_session.query(SegmentStatistic).filter(SegmentStatistic.segment_type == "year").all()
    assert len(years) == 10
    year_map = {y.segment_value: y for y in years}
    assert "2015" in year_map and "2024" in year_map
    assert year_map["2015"].count == 105120
    assert year_map["2024"].count == 53344  # Jan-Jul partial year


def test_extreme_value_day_based_return_periods(db_session):
    """Verifies all six day-based EVT return periods, null CIs and no legacy annual records."""
    evs = db_session.query(ExtremeValueResult).order_by(ExtremeValueResult.return_period_days.asc()).all()
    assert len(evs) == 6

    expected_days = [7, 30, 90, 180, 365, 730]
    actual_days = [e.return_period_days for e in evs]
    assert actual_days == expected_days

    # Shape parameter is negative (Weibull domain)
    for e in evs:
        assert e.block_type == "daily_maxima"
        assert e.sample_maxima_count == 41667
        assert pytest.approx(e.shape_xi, rel=1e-3) == -0.044268
        assert pytest.approx(e.loc_mu, rel=1e-3) == 64.1015
        assert pytest.approx(e.scale_sigma, rel=1e-3) == 21.1282
        # CIs must be null (uncomputed)
        assert e.ci_lower_95 is None
        assert e.ci_upper_95 is None
