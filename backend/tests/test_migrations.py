"""
Test suite for database migrations and rollback behavior on disposable database.
Mandatory Safeguard 2 verification.
"""
import pytest
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from pathlib import Path

PG_HOST = "localhost"
PG_PORT = 5432
PG_USER = "postgres"
PG_PASS = "root"
DISPOSABLE_DB = "disposable_test_migration_pytest"

BASE_DIR = Path(__file__).resolve().parent.parent
MIGRATIONS_DIR = BASE_DIR / "migrations"
UPGRADE_SQL = MIGRATIONS_DIR / "001_support_colab_artifacts.sql"
DOWNGRADE_SQL = MIGRATIONS_DIR / "001_downgrade.sql"


@pytest.fixture(scope="module")
def disposable_db():
    conn_root = psycopg2.connect(dbname="postgres", user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)
    conn_root.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    with conn_root.cursor() as cur:
        cur.execute(f"DROP DATABASE IF EXISTS {DISPOSABLE_DB};")
        cur.execute(f"CREATE DATABASE {DISPOSABLE_DB};")
    conn_root.close()

    # Create baseline schema in disposable DB
    conn = psycopg2.connect(dbname=DISPOSABLE_DB, user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)
    with conn.cursor() as cur:
        cur.execute("""
        CREATE TABLE distribution_fits (
            id SERIAL PRIMARY KEY,
            distribution VARCHAR(50) UNIQUE NOT NULL,
            param_shape DOUBLE PRECISION,
            param_loc DOUBLE PRECISION NOT NULL DEFAULT 0.0,
            param_scale DOUBLE PRECISION NOT NULL,
            aic DOUBLE PRECISION NOT NULL,
            bic DOUBLE PRECISION NOT NULL,
            ks_statistic DOUBLE PRECISION NOT NULL,
            ks_pvalue DOUBLE PRECISION NOT NULL,
            ad_statistic DOUBLE PRECISION NOT NULL,
            rank INTEGER NOT NULL,
            parameters_json JSON
        );
        CREATE TABLE extreme_value_results (
            id SERIAL PRIMARY KEY,
            block_type VARCHAR(50) NOT NULL,
            sample_maxima_count INTEGER NOT NULL,
            shape_xi DOUBLE PRECISION NOT NULL,
            loc_mu DOUBLE PRECISION NOT NULL,
            scale_sigma DOUBLE PRECISION NOT NULL,
            return_period_years INTEGER NOT NULL,
            return_level_kwh DOUBLE PRECISION NOT NULL,
            ci_lower_95 DOUBLE PRECISION NOT NULL,
            ci_upper_95 DOUBLE PRECISION NOT NULL
        );
        """)
    conn.commit()
    conn.close()

    yield DISPOSABLE_DB

    # Cleanup disposable database
    conn_root = psycopg2.connect(dbname="postgres", user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)
    conn_root.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    with conn_root.cursor() as cur:
        cur.execute(f"DROP DATABASE IF EXISTS {DISPOSABLE_DB};")
    conn_root.close()


def test_upgrade_and_downgrade_migrations(disposable_db):
    conn = psycopg2.connect(dbname=disposable_db, user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)

    # 1. Apply Upgrade
    with open(UPGRADE_SQL, "r", encoding="utf-8") as f:
        upgrade_sql = f.read()
    with conn.cursor() as cur:
        cur.execute(upgrade_sql)
    conn.commit()

    # Verify upgrade columns & constraints
    with conn.cursor() as cur:
        cur.execute("""
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'extreme_value_results';
        """)
        ev_cols = dict(cur.fetchall())
        assert "return_period_days" in ev_cols, "return_period_days must exist after upgrade"
        assert ev_cols["return_period_years"] == "YES", "return_period_years must be nullable"
        assert ev_cols["ci_lower_95"] == "YES", "ci_lower_95 must be nullable"
        assert ev_cols["ci_upper_95"] == "YES", "ci_upper_95 must be nullable"

        cur.execute("""
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'distribution_fits' AND column_name = 'ad_statistic';
        """)
        ad_col = cur.fetchone()
        assert ad_col[1] == "YES", "ad_statistic must be nullable after upgrade"

    # 2. Apply Downgrade
    with open(DOWNGRADE_SQL, "r", encoding="utf-8") as f:
        downgrade_sql = f.read()
    with conn.cursor() as cur:
        cur.execute(downgrade_sql)
    conn.commit()

    # Verify downgrade restoration
    with conn.cursor() as cur:
        cur.execute("""
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'extreme_value_results';
        """)
        ev_cols_down = dict(cur.fetchall())
        assert "return_period_days" not in ev_cols_down, "return_period_days must be removed on rollback"
        assert ev_cols_down["return_period_years"] == "NO", "return_period_years must be NOT NULL after rollback"
        assert ev_cols_down["ci_lower_95"] == "NO", "ci_lower_95 must be NOT NULL after rollback"

        cur.execute("""
            SELECT column_name, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'distribution_fits' AND column_name = 'ad_statistic';
        """)
        ad_col_down = cur.fetchone()
        assert ad_col_down[1] == "NO", "ad_statistic must be NOT NULL after rollback"

    conn.close()
