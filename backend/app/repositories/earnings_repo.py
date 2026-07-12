import json
from typing import Optional, List, Dict, Any
from datetime import date
from app.core.db import get_conn

def get_cached_screened_candidates(screen_date: date) -> Optional[List[Dict[str, Any]]]:
    """Retrieve daily cached screened candidates."""
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT candidates FROM earnings_screened_candidates
        WHERE screen_date = %s
    """, (screen_date,))
    row = c.fetchone()
    conn.close()
    if row and row["candidates"]:
        return row["candidates"]
    return None

def save_cached_screened_candidates(screen_date: date, candidates: List[Dict[str, Any]]) -> None:
    """Cache screened candidates list under a specific date."""
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        INSERT INTO earnings_screened_candidates (screen_date, candidates)
        VALUES (%s, %s)
        ON CONFLICT (screen_date) DO UPDATE SET candidates = EXCLUDED.candidates
    """, (screen_date, json.dumps(candidates)))
    conn.commit()
    conn.close()

def save_earnings_rally_prediction(
    symbol: str,
    company_name: str,
    earnings_date: date,
    predicted_trajectory: List[float],
    optimal_entry_day: int,
    optimal_exit_day: int,
    expected_return_pct: float,
    rally_probability: float,
    llm_reasoning: str,
    actual_trajectory: Optional[List[Dict[str, Any]]] = None,
    actual_return_pct: Optional[float] = None
) -> int:
    """Save or update an earnings rally prediction record."""
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        INSERT INTO earnings_rally_predictions (
            symbol, company_name, earnings_date, predicted_trajectory, 
            optimal_entry_day, optimal_exit_day, expected_return_pct, 
            rally_probability, llm_reasoning, actual_trajectory, actual_return_pct
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (symbol, earnings_date) DO UPDATE SET
            predicted_trajectory = EXCLUDED.predicted_trajectory,
            optimal_entry_day = EXCLUDED.optimal_entry_day,
            optimal_exit_day = EXCLUDED.optimal_exit_day,
            expected_return_pct = EXCLUDED.expected_return_pct,
            rally_probability = EXCLUDED.rally_probability,
            llm_reasoning = EXCLUDED.llm_reasoning,
            actual_trajectory = EXCLUDED.actual_trajectory,
            actual_return_pct = EXCLUDED.actual_return_pct
        RETURNING id
    """, (
        symbol,
        company_name,
        earnings_date,
        json.dumps(predicted_trajectory),
        optimal_entry_day,
        optimal_exit_day,
        expected_return_pct,
        rally_probability,
        llm_reasoning,
        json.dumps(actual_trajectory) if actual_trajectory else None,
        actual_return_pct
    ))
    row_id = c.fetchone()["id"]
    conn.commit()
    conn.close()
    return row_id

def get_all_earnings_rally_predictions() -> List[Dict[str, Any]]:
    """Retrieve all previously generated predictions sorted by date descending."""
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT id, symbol, company_name, earnings_date, predicted_trajectory, 
               optimal_entry_day, optimal_exit_day, expected_return_pct, 
               rally_probability, llm_reasoning, actual_trajectory, actual_return_pct, created_at
        FROM earnings_rally_predictions
        ORDER BY created_at DESC
    """)
    rows = c.fetchall()
    conn.close()
    
    predictions = []
    for row in rows:
        predictions.append({
            "id": row["id"],
            "symbol": row["symbol"],
            "company_name": row["company_name"],
            "earnings_date": str(row["earnings_date"]),
            "predicted_trajectory": row["predicted_trajectory"],
            "optimal_entry_day": row["optimal_entry_day"],
            "optimal_exit_day": row["optimal_exit_day"],
            "expected_return_pct": float(row["expected_return_pct"]),
            "rally_probability": float(row["rally_probability"]),
            "llm_reasoning": row["llm_reasoning"],
            "actual_trajectory": row["actual_trajectory"],
            "actual_return_pct": float(row["actual_return_pct"]) if row["actual_return_pct"] is not None else None,
            "created_at": str(row["created_at"])
        })
    return predictions
