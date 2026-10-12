"""
Live API Smoke Test Script.
Starts FastAPI application and sends real HTTP requests against all endpoints.
"""
import sys
import time
import subprocess
import requests

BASE_URL = "http://127.0.0.1:8000"

def run_smoke_test():
    print("=== LIVE API SMOKE TESTS ===")
    
    # 1. Start uvicorn in background subprocess
    print("Starting Uvicorn server on port 8000...")
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=r"C:\Users\VIBIN\Vibin Projects\Smart Grid Energy\backend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    try:
        # Wait for server to come up
        ready = False
        for i in range(20):
            try:
                r = requests.get(f"{BASE_URL}/health", timeout=1)
                if r.status_code == 200:
                    ready = True
                    break
            except Exception:
                time.sleep(0.5)
                
        if not ready:
            stdout, stderr = proc.communicate(timeout=5)
            raise RuntimeError(f"Server failed to start:\nStdout: {stdout}\nStderr: {stderr}")
            
        print("Server is online and healthy.\n")
        
        endpoints = [
            ("/", "Root Endpoint"),
            ("/health", "Health Check"),
            ("/api/v1/overview", "Overview"),
            ("/api/v1/distributions/compare", "Distribution Comparison"),
            ("/api/v1/distributions/curves?points=20", "Distribution Curves"),
            ("/api/v1/sectors", "Sector Analysis"),
            ("/api/v1/peak", "Peak Analysis"),
            ("/api/v1/seasonal", "Seasonal Analysis"),
            ("/api/v1/hourly", "Hourly Profiles"),
            ("/api/v1/temporal-shift", "Temporal Shift"),
            ("/api/v1/extreme-values?block_type=daily_maxima", "Extreme Values (Daily Maxima)"),
        ]
        
        all_passed = True
        for path, label in endpoints:
            url = f"{BASE_URL}{path}"
            r = requests.get(url, timeout=5)
            status = r.status_code
            print(f"[{status}] {label} -> {path}")
            if status != 200:
                print(f"  FAILED: {r.text}")
                all_passed = False
            else:
                data = r.json()
                if "data" in data and isinstance(data["data"], dict):
                    keys = list(data["data"].keys())[:5]
                    print(f"  OK (keys: {keys})")
                elif "data" in data and isinstance(data["data"], list):
                    print(f"  OK (items count: {len(data['data'])})")
                else:
                    print(f"  OK: {data}")
                    
        print("\nAll live API smoke tests completed successfully!")
        assert all_passed, "Some smoke test endpoints failed!"
        
    finally:
        print("Terminating server...")
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        print("Server terminated cleanly.")

if __name__ == "__main__":
    run_smoke_test()
