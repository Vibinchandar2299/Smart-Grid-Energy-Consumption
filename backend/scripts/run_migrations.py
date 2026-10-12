"""
Migration runner with disposable database upgrade & downgrade validation.
Safeguard 2 verification.
"""
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from pathlib import Path

PG_HOST = "localhost"
PG_PORT = 5432
PG_USER = "postgres"
PG_PASS = "root"
TARGET_DB = "smart_grid_energy"
DISPOSABLE_DB = "disposable_migration_test"

BASE_DIR = Path(__file__).resolve().parent.parent
MIGRATIONS_DIR = BASE_DIR / "migrations"
UPGRADE_SQL = MIGRATIONS_DIR / "001_support_colab_artifacts.sql"
DOWNGRADE_SQL = MIGRATIONS_DIR / "001_downgrade.sql"

def run_sql_file(conn, file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        sql = f.read()
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()

def inspect_columns(conn, table):
    with conn.cursor() as cur:
        cur.execute(f"""
            SELECT column_name, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = '{table}';
        """)
        return {row[0]: (row[1], row[2]) for row in cur.fetchall()}

def test_migration_on_disposable():
    print("--- 1. Testing migration on disposable database ---")
    conn_root = psycopg2.connect(dbname="postgres", user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)
    conn_root.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    with conn_root.cursor() as cur:
        cur.execute(f"DROP DATABASE IF EXISTS {DISPOSABLE_DB};")
        cur.execute(f"CREATE DATABASE {DISPOSABLE_DB};")
    conn_root.close()

    # Create baseline schema in disposable DB
    conn_disp = psycopg2.connect(dbname=DISPOSABLE_DB, user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)
    with conn_disp.cursor() as cur:
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
    conn_disp.commit()

    # Test UPGRADE
    print("Testing UPGRADE on disposable database...")
    run_sql_file(conn_disp, UPGRADE_SQL)
    cols_ev = inspect_columns(conn_disp, "extreme_value_results")
    cols_df = inspect_columns(conn_disp, "distribution_fits")
    
    assert "return_period_days" in cols_ev, "return_period_days missing after upgrade"
    assert cols_ev["return_period_years"][0] == "YES", "return_period_years must be nullable"
    assert cols_ev["ci_lower_95"][0] == "YES", "ci_lower_95 must be nullable"
    assert cols_ev["ci_upper_95"][0] == "YES", "ci_upper_95 must be nullable"
    assert cols_df["ad_statistic"][0] == "YES", "ad_statistic must be nullable"
    print("UPGRADE validation on disposable database PASSED.")

    # Test DOWNGRADE
    print("Testing DOWNGRADE on disposable database...")
    run_sql_file(conn_disp, DOWNGRADE_SQL)
    cols_ev_down = inspect_columns(conn_disp, "extreme_value_results")
    cols_df_down = inspect_columns(conn_disp, "distribution_fits")
    
    assert "return_period_days" not in cols_ev_down, "return_period_days must be removed on downgrade"
    assert cols_ev_down["return_period_years"][0] == "NO", "return_period_years must be NOT NULL after downgrade"
    assert cols_ev_down["ci_lower_95"][0] == "NO", "ci_lower_95 must be NOT NULL after downgrade"
    assert cols_df_down["ad_statistic"][0] == "NO", "ad_statistic must be NOT NULL after downgrade"
    print("DOWNGRADE validation on disposable database PASSED.")

    conn_disp.close()
    
    # Drop disposable database
    conn_root = psycopg2.connect(dbname="postgres", user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)
    conn_root.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    with conn_root.cursor() as cur:
        cur.execute(f"DROP DATABASE IF EXISTS {DISPOSABLE_DB};")
    conn_root.close()
    print("Disposable database cleaned up successfully.\n")

def apply_migration_to_target():
    print(f"--- 2. Applying UPGRADE migration to target database '{TARGET_DB}' ---")
    conn_target = psycopg2.connect(dbname=TARGET_DB, user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)
    run_sql_file(conn_target, UPGRADE_SQL)
    
    cols_ev = inspect_columns(conn_target, "extreme_value_results")
    cols_df = inspect_columns(conn_target, "distribution_fits")
    assert "return_period_days" in cols_ev
    assert cols_df["ad_statistic"][0] == "YES"
    
    with conn_target.cursor() as cur:
        cur.execute("""
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'extreme_value_results';
        """)
        indexes = cur.fetchall()
        print(f"Verified indexes on extreme_value_results: {[i[0] for i in indexes]}")
        
    conn_target.close()
    print(f"Migration applied and verified on '{TARGET_DB}' successfully.")

if __name__ == "__main__":
    test_migration_on_disposable()
    apply_migration_to_target()
