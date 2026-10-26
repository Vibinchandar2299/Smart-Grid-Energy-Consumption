from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

sectors = ["All", "Industrial", "Domestic", "Commercial", "Agriculture", "Miscellaneous"]
print(f"{'Sector':<15} | {'Reference N':<12} | {'P99 Cutoff':<10} | {'Exceedances':<12} | {'Pct (%)':<8}")
print("-" * 65)

for s in sectors:
    url = f"/api/v1/consumption/high-consumption?percentile=99.0&sector={s}&limit=5"
    res = client.get(url)
    data = res.json()["data"]
    ref_n = data["total_reference_count"]
    cutoff = data["calculated_threshold_kwh"]
    exc_n = data["exceedance_count"]
    exc_pct = data["exceedance_percentage"]
    print(f"{s:<15} | {ref_n:<12} | {cutoff:<10.2f} | {exc_n:<12} | {exc_pct:<8.2f}")
