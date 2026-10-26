"""
Ingest Raw Records into PostgreSQL:
Loads the 1,000,000 synthetic smart meter observations into PostgreSQL
for genuine interactive filtering, high-consumption detection, and aggregations.
"""
import time
from pathlib import Path
import psycopg2

def ingest_raw_dataset(csv_path: Path = None, db_url: str = "postgresql://postgres:root@localhost:5432/smart_grid_energy"):
    if csv_path is None:
        csv_path = Path(r"C:\Users\VIBIN\Downloads\tamil_nadu_synthetic_smart_grid_energy_v2_1M.csv")
    
    if not csv_path.exists():
        print(f"Error: Dataset not found at {csv_path}")
        return False

    print(f"Connecting to database: {db_url}...")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # 1. Create table if not exists
    cur.execute("""
    CREATE TABLE IF NOT EXISTS energy_consumption_records (
        id BIGSERIAL PRIMARY KEY,
        timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        state VARCHAR(50),
        district VARCHAR(50),
        sector VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        quarter INTEGER,
        season VARCHAR(50) NOT NULL,
        day_of_month INTEGER,
        day_of_week INTEGER,
        weekend_flag INTEGER,
        holiday_flag INTEGER,
        day_type VARCHAR(50),
        hour INTEGER NOT NULL,
        peak_period_flag INTEGER NOT NULL,
        energy_consumption_kwh DOUBLE PRECISION NOT NULL,
        generation_event_type VARCHAR(50)
    );
    """)
    conn.commit()

    # 2. Check current count
    cur.execute("SELECT COUNT(*) FROM energy_consumption_records;")
    count = cur.fetchone()[0]
    if count >= 1000000:
        print(f"Table already contains {count:,} records. Skipping ingestion.")
        conn.close()
        return True

    # Truncate if partial
    if count > 0:
        print(f"Table has {count} partial records. Truncating for clean reload...")
        cur.execute("TRUNCATE TABLE energy_consumption_records;")
        conn.commit()

    print(f"Starting COPY from {csv_path}...")
    t0 = time.time()
    with open(csv_path, "r", encoding="utf-8") as f:
        copy_sql = """
        COPY energy_consumption_records (
            timestamp, state, district, sector, year, month, quarter, season,
            day_of_month, day_of_week, weekend_flag, holiday_flag, day_type,
            hour, peak_period_flag, energy_consumption_kwh, generation_event_type
        ) FROM STDIN WITH (FORMAT csv, HEADER true);
        """
        cur.copy_expert(copy_sql, f)
    conn.commit()
    t_copy = time.time() - t0
    print(f"Data COPY completed in {t_copy:.2f}s.")

    # 3. Create high-performance indexes
    print("Building composite and single-column indexes for fast filtering...")
    t_idx0 = time.time()
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_ecr_sector ON energy_consumption_records (sector);",
        "CREATE INDEX IF NOT EXISTS idx_ecr_year ON energy_consumption_records (year);",
        "CREATE INDEX IF NOT EXISTS idx_ecr_month ON energy_consumption_records (month);",
        "CREATE INDEX IF NOT EXISTS idx_ecr_season ON energy_consumption_records (season);",
        "CREATE INDEX IF NOT EXISTS idx_ecr_hour ON energy_consumption_records (hour);",
        "CREATE INDEX IF NOT EXISTS idx_ecr_peak ON energy_consumption_records (peak_period_flag);",
        "CREATE INDEX IF NOT EXISTS idx_ecr_timestamp ON energy_consumption_records (timestamp);",
        "CREATE INDEX IF NOT EXISTS idx_ecr_kwh ON energy_consumption_records (energy_consumption_kwh);",
        "CREATE INDEX IF NOT EXISTS idx_ecr_filter_composite ON energy_consumption_records (sector, year, season, peak_period_flag);",
    ]
    for idx_sql in indexes:
        cur.execute(idx_sql)
    conn.commit()
    t_idx = time.time() - t_idx0
    print(f"Indexes built in {t_idx:.2f}s.")

    cur.execute("SELECT COUNT(*) FROM energy_consumption_records;")
    total_count = cur.fetchone()[0]
    print(f"Total rows in energy_consumption_records: {total_count:,}")

    cur.close()
    conn.close()
    return True

if __name__ == "__main__":
    ingest_raw_dataset()
