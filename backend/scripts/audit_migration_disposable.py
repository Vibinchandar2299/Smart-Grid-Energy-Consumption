"""
Phase 4C Migration Safety Audit Script.
Tests upgrade migration and downgrade rollback on a disposable database
populated with representative legacy rows (including monthly maxima, annual return periods,
and null fields).
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from pathlib import Path

PG_HOST = "localhost"
PG_PORT = 5432
PG_USER = "postgres"
PG_PASS = "root"
DISPOSABLE_DB = "disposable_migration_audit_db"

BASE_DIR = Path(__file__).resolve().parent.parent
MIGRATIONS_DIR = BASE_DIR / "migrations"
UPGRADE_SQL = MIGRATIONS_DIR / "001_support_colab_artifacts.sql"
DOWNGRADE_SQL = MIGRATIONS_DIR / "001_downgrade.sql"

def main():
    print("=== AUDIT STEP 1: MIGRATION SAFETY WITH REPRESENTATIVE LEGACY ROWS ===")
    
    # 1. Create fresh disposable database
    conn_root = psycopg2.connect(dbname="postgres", user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)
    conn_root.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    with conn_root.cursor() as cur:
        cur.execute(f"DROP DATABASE IF EXISTS {DISPOSABLE_DB};")
        cur.execute(f"CREATE DATABASE {DISPOSABLE_DB};")
    conn_root.close()
    print(f"Created disposable database: {DISPOSABLE_DB}")

    conn = psycopg2.connect(dbname=DISPOSABLE_DB, user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)
    with conn.cursor() as cur:
        # Create baseline schema before migration
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
        
        # Insert representative legacy rows
        # Row 1: Legacy annual record (monthly_maxima)
        cur.execute("""
        INSERT INTO extreme_value_results 
        (block_type, sample_maxima_count, shape_xi, loc_mu, scale_sigma, return_period_years, return_level_kwh, ci_lower_95, ci_upper_95)
        VALUES 
        ('monthly_maxima', 120, 0.124, 104.5, 14.8, 10, 155.2, 140.1, 172.5),
        ('monthly_maxima', 120, 0.124, 104.5, 14.8, 25, 170.8, 152.3, 191.0);
        """)
        
        # Row 2: Legacy distribution fit with non-null AD
        cur.execute("""
        INSERT INTO distribution_fits
        (distribution, param_shape, param_loc, param_scale, aic, bic, ks_statistic, ks_pvalue, ad_statistic, rank)
        VALUES
        ('Gamma', 5.12, 0.0, 8.35, 12000.5, 12015.2, 0.021, 0.45, 1.25, 1);
        """)
    conn.commit()
    print("Baseline schema and representative legacy rows inserted.")

    # 2. Apply UPGRADE migration
    with open(UPGRADE_SQL, "r", encoding="utf-8") as f:
        upgrade_sql = f.read()
    with conn.cursor() as cur:
        cur.execute(upgrade_sql)
    conn.commit()
    print("Upgrade migration executed.")

    # Verify upgrade results:
    with conn.cursor() as cur:
        # Check that legacy monthly_maxima were moved to quarantine table
        cur.execute("SELECT count(*) FROM extreme_value_results;")
        active_count = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM extreme_value_results_quarantine;")
        quarantine_count = cur.fetchone()[0]
        print(f"Post-upgrade: Active EVT rows = {active_count}, Quarantined EVT rows = {quarantine_count}")
        assert active_count == 0, f"Expected 0 active legacy rows, got {active_count}"
        assert quarantine_count == 2, f"Expected 2 quarantined rows, got {quarantine_count}"

        # Insert new day-based EVT records with null CIs into active table
        cur.execute("""
        INSERT INTO extreme_value_results 
        (block_type, sample_maxima_count, shape_xi, loc_mu, scale_sigma, return_period_days, return_period_years, return_level_kwh, ci_lower_95, ci_upper_95)
        VALUES
        ('daily_maxima', 41667, -0.044268, 64.1015, 21.1282, 7, 0.019, 105.29, NULL, NULL),
        ('daily_maxima', 41667, -0.044268, 64.1015, 21.1282, 30, 0.082, 141.24, NULL, NULL);
        """)
        
        # Insert new distribution fit with NULL AD statistic
        cur.execute("""
        INSERT INTO distribution_fits
        (distribution, param_shape, param_loc, param_scale, aic, bic, ks_statistic, ks_pvalue, ad_statistic, rank)
        VALUES
        ('Log-normal', 0.84, 0.0, 14.7, 79049.2, 79065.1, 0.008, 0.62, NULL, 2);
        """)
    conn.commit()
    print("Successfully inserted new day-based EVT records with NULL CIs and NULL AD.")

    # Check index existence
    with conn.cursor() as cur:
        cur.execute("""
        SELECT indexname FROM pg_indexes 
        WHERE tablename = 'extreme_value_results' AND indexname = 'ix_extreme_value_results_return_period_days';
        """)
        index_exists = cur.fetchone()
        assert index_exists is not None, "Index ix_extreme_value_results_return_period_days must exist"
        print("Verified index ix_extreme_value_results_return_period_days.")

    # 3. Apply DOWNGRADE migration
    with open(DOWNGRADE_SQL, "r", encoding="utf-8") as f:
        downgrade_sql = f.read()
    with conn.cursor() as cur:
        cur.execute(downgrade_sql)
    conn.commit()
    print("Downgrade migration executed.")

    # Verify downgrade restoration:
    with conn.cursor() as cur:
        # Check quarantine table dropped
        cur.execute("SELECT to_regclass('extreme_value_results_quarantine');")
        quarantine_table = cur.fetchone()[0]
        assert quarantine_table is None, "Quarantine table must be dropped after downgrade"

        # Check return_period_days column dropped
        cur.execute("""
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'extreme_value_results' AND column_name = 'return_period_days';
        """)
        col_days = cur.fetchone()
        assert col_days is None, "return_period_days column must be dropped after downgrade"

        # Check that ad_statistic is NOT NULL again
        cur.execute("""
        SELECT is_nullable FROM information_schema.columns 
        WHERE table_name = 'distribution_fits' AND column_name = 'ad_statistic';
        """)
        ad_null = cur.fetchone()[0]
        assert ad_null == "NO", "ad_statistic must be NOT NULL after downgrade"
        print("Verified downgrade schema restoration: NOT NULL restored, return_period_days dropped, quarantine removed.")

    conn.close()

    # 4. Clean up disposable database
    conn_root = psycopg2.connect(dbname="postgres", user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)
    conn_root.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    with conn_root.cursor() as cur:
        cur.execute(f"DROP DATABASE IF EXISTS {DISPOSABLE_DB};")
    conn_root.close()
    print(f"Cleaned up disposable database: {DISPOSABLE_DB}")
    print("MIGRATION & QUARANTINE SAFETY AUDIT: PASS\n")

if __name__ == "__main__":
    main()
