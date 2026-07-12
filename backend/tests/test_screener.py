import sys
import os
from fastapi.testclient import TestClient

# Add parent dir to path so we can import app and main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.log import init_db

client = TestClient(app)

def test_earnings_rally_flow():
    # 1. Initialize DB to make sure our table exists
    init_db()
    
    # 2. Get rally candidates (limit=6)
    print("Testing GET /earnings/rally/candidates...")
    res = client.get("/earnings/rally/candidates?limit=6")
    assert res.status_code == 200, f"Candidates endpoint failed: {res.text}"
    data = res.json()
    assert data["status"] == "success"
    assert "candidates" in data
    candidates = data["candidates"]
    assert len(candidates) == 6
    print(f"Screener returned {len(candidates)} candidates.")
    
    # Let's inspect a candidate details
    cand = candidates[0]
    print(f"Top Candidate: {cand['symbol']} (Win rate: {cand['win_rate']:.0%}, Opportunity Score: {cand['score']:.4f})")
    
    # 3. Analyze candidate (POST request)
    print(f"Testing POST /earnings/rally/analyze for {cand['symbol']}...")
    analysis_payload = {
        "symbol": cand["symbol"],
        "company_name": cand["company_name"],
        "earnings_date": cand["earnings_date"],
        "rally_probability": cand["win_rate"],
        "history": cand["history"]
    }
    
    analyze_res = client.post("/earnings/rally/analyze", json=analysis_payload)
    assert analyze_res.status_code == 200, f"Analysis endpoint failed: {analyze_res.text}"
    analyze_data = analyze_res.json()
    assert analyze_data["status"] == "success"
    assert "prediction_id" in analyze_data
    assert "forecast" in analyze_data
    
    forecast = analyze_data["forecast"]
    print("\nLLM Forecasting Output:")
    print(f"  Symbol: {cand['symbol']}")
    print(f"  Optimal Entry: Day {forecast['optimal_entry_day']}")
    print(f"  Optimal Exit: Day {forecast['optimal_exit_day']}")
    print(f"  Expected Return: {forecast['expected_return_pct']}%")
    print(f"  LLM Reasoning: {forecast['llm_reasoning'][:200]}...")
    
    # 4. Get saved predictions
    print("\nTesting GET /earnings/rally/predictions...")
    pred_res = client.get("/earnings/rally/predictions")
    assert pred_res.status_code == 200, f"Predictions retrieval failed: {pred_res.text}"
    pred_data = pred_res.json()
    assert pred_data["status"] == "success"
    assert pred_data["count"] > 0
    print(f"Retrieved {pred_data['count']} active forecasting records from DB.")
    
    print("\nAll top-6 earnings rally forecaster and optimizer tests passed successfully!")

if __name__ == "__main__":
    test_earnings_rally_flow()
