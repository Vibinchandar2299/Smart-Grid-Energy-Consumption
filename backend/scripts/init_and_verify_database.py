"""
Database Initialization, Backup and Disposable Restoration Verification
"""
import os
import subprocess
from pathlib import Path
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

PG_HOST = "localhost"
PG_PORT = 5432
PG_USER = "postgres"
PG_PASS = "root"
TARGET_DB = "smart_grid_energy"
DISPOSABLE_DB = "disposable_restore_test"
BACKUP_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "backups"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)
BACKUP_FILE = BACKUP_DIR / "smart_grid_energy_initial_backup.sql"

def main():
    print("=== STEP 1: DATABASE INITIALIZATION & BACKUP INTEGRITY ===")
    
    # 1. Connect to postgres root and verify target database does NOT exist
    conn = psycopg2.connect(dbname="postgres", user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    cur.execute("SELECT datname FROM pg_database WHERE datname = %s;", (TARGET_DB,))
    exists = cur.fetchone()
    print(f"Checking if '{TARGET_DB}' exists before creation: {bool(exists)}")
    if exists:
        print(f"Target database '{TARGET_DB}' already exists. Preserving without recreating.")
    else:
        cur.execute(f"CREATE DATABASE {TARGET_DB} WITH ENCODING 'UTF8';")
        print(f"Created target database '{TARGET_DB}' successfully.")
    
    cur.close()
    conn.close()

    # 2. Connect to target DB and create initial schema tables
    conn_target = psycopg2.connect(dbname=TARGET_DB, user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)
    cur_target = conn_target.cursor()
    
    initial_schema_sql = """
    CREATE TABLE IF NOT EXISTS descriptive_statistics (
        id SERIAL PRIMARY KEY,
        scope VARCHAR(50) UNIQUE NOT NULL,
        count INTEGER NOT NULL,
        mean DOUBLE PRECISION NOT NULL,
        std DOUBLE PRECISION NOT NULL,
        variance DOUBLE PRECISION NOT NULL,
        min_val DOUBLE PRECISION NOT NULL,
        q25 DOUBLE PRECISION NOT NULL,
        median DOUBLE PRECISION NOT NULL,
        q75 DOUBLE PRECISION NOT NULL,
        max_val DOUBLE PRECISION NOT NULL,
        skewness DOUBLE PRECISION NOT NULL,
        kurtosis DOUBLE PRECISION NOT NULL
    );

    CREATE TABLE IF NOT EXISTS distribution_fits (
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

    CREATE TABLE IF NOT EXISTS segment_statistics (
        id SERIAL PRIMARY KEY,
        segment_type VARCHAR(50) NOT NULL,
        segment_value VARCHAR(50) NOT NULL,
        count INTEGER NOT NULL,
        mean_kwh DOUBLE PRECISION NOT NULL,
        std_kwh DOUBLE PRECISION NOT NULL,
        median_kwh DOUBLE PRECISION NOT NULL,
        min_kwh DOUBLE PRECISION NOT NULL,
        max_kwh DOUBLE PRECISION NOT NULL,
        skewness DOUBLE PRECISION NOT NULL,
        kurtosis DOUBLE PRECISION NOT NULL,
        best_fit_dist VARCHAR(50) NOT NULL,
        dist_shape DOUBLE PRECISION,
        dist_loc DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        dist_scale DOUBLE PRECISION NOT NULL,
        ks_stat DOUBLE PRECISION NOT NULL
    );

    CREATE TABLE IF NOT EXISTS extreme_value_results (
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
    """
    cur_target.execute(initial_schema_sql)
    conn_target.commit()
    print("Initial schema created in target database.")
    cur_target.close()
    conn_target.close()

    # 3. Create a full backup of the target database
    print(f"Creating backup file: {BACKUP_FILE}...")
    # Find pg_dump on windows if in PostgreSQL bin
    pg_bin_dirs = [
        r"C:\Program Files\PostgreSQL\18\bin",
        r"C:\Program Files\PostgreSQL\17\bin",
        r"C:\Program Files\PostgreSQL\16\bin",
        r"C:\Program Files\PostgreSQL\15\bin",
        r"C:\Program Files\PostgreSQL\14\bin",
    ]
    pg_dump_path = "pg_dump"
    for d in pg_bin_dirs:
        candidate = Path(d) / "pg_dump.exe"
        if candidate.exists():
            pg_dump_path = str(candidate)
            break
            
    env = os.environ.copy()
    env["PGPASSWORD"] = PG_PASS
    
    cmd = [
        pg_dump_path,
        "-h", PG_HOST,
        "-p", str(PG_PORT),
        "-U", PG_USER,
        "-d", TARGET_DB,
        "-F", "p",
        "-f", str(BACKUP_FILE),
    ]
    res = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"pg_dump failed: {res.stderr}")
    print(f"Backup verified. File size: {BACKUP_FILE.stat().st_size} bytes.")

    # 4. Test restoration into disposable database
    conn = psycopg2.connect(dbname="postgres", user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    cur.execute(f"DROP DATABASE IF EXISTS {DISPOSABLE_DB};")
    cur.execute(f"CREATE DATABASE {DISPOSABLE_DB};")
    cur.close()
    conn.close()
    print(f"Created disposable test database '{DISPOSABLE_DB}' for restore validation.")

    psql_path = "psql"
    for d in pg_bin_dirs:
        candidate = Path(d) / "psql.exe"
        if candidate.exists():
            psql_path = str(candidate)
            break

    cmd_restore = [
        psql_path,
        "-h", PG_HOST,
        "-p", str(PG_PORT),
        "-U", PG_USER,
        "-d", DISPOSABLE_DB,
        "-f", str(BACKUP_FILE),
    ]
    res_restore = subprocess.run(cmd_restore, env=env, capture_output=True, text=True)
    if res_restore.returncode != 0:
        raise RuntimeError(f"Restoration into disposable database failed: {res_restore.stderr}")
    print("Backup restored successfully into disposable test database.")

    # Verify tables in disposable database
    conn_disp = psycopg2.connect(dbname=DISPOSABLE_DB, user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)
    cur_disp = conn_disp.cursor()
    cur_disp.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")
    tables = [r[0] for r in cur_disp.fetchall()]
    print(f"Restored tables verified in disposable DB: {tables}")
    assert "extreme_value_results" in tables and "distribution_fits" in tables
    cur_disp.close()
    conn_disp.close()

    # Drop disposable database
    conn = psycopg2.connect(dbname="postgres", user=PG_USER, password=PG_PASS, host=PG_HOST, port=PG_PORT)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    cur.execute(f"DROP DATABASE IF EXISTS {DISPOSABLE_DB};")
    cur.close()
    conn.close()
    print(f"Disposable database '{DISPOSABLE_DB}' cleaned up successfully.")

    # 5. Create backend/.env with correct database credentials
    env_file = Path(__file__).resolve().parent.parent / ".env"
    env_content = f"""PROJECT_NAME="Smart Grid Energy Consumption Statistical Modeling API"
API_V1_STR="/api/v1"
ENVIRONMENT="development"
DATABASE_URL=postgresql+psycopg2://{PG_USER}:{PG_PASS}@{PG_HOST}:{PG_PORT}/{TARGET_DB}
HOST=0.0.0.0
PORT=8000
BACKEND_CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
ARTIFACTS_DIR="../data/staged_artifacts"
"""
    with open(env_file, "w", encoding="utf-8") as f:
        f.write(env_content)
    print(f"Configured: {env_file}")
    print("Database initialization and backup verification complete.\n")

if __name__ == "__main__":
    main()
