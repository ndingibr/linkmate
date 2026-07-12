import datetime
from yahooquery import Ticker
import pandas as pd
import numpy as np

def get_earnings_window_prices(symbol: str, reported_date_str: str) -> dict:
    """
    Get daily closing prices and normalized returns from 10 trading days before
    to 10 trading days after the specified reported date.
    
    Returns a list of dicts: [{'day': -10, 'date': '...', 'price': ..., 'return_pct': ...}]
    """
    try:
        reported_date = datetime.datetime.strptime(reported_date_str, "%Y-%m-%d").date()
    except Exception:
        # Fallback if in datetime format already
        reported_date = reported_date_str
        
    ticker = Ticker(symbol)
    
    # We query 20 calendar days before and after to guarantee we capture 10 trading days on both sides
    start_date = reported_date - datetime.timedelta(days=22)
    end_date = reported_date + datetime.timedelta(days=22)
    
    try:
        hist = ticker.history(start=start_date, end=end_date)
        if hist.empty or "adjclose" not in hist.columns:
            return {"history": [], "base_price": 0.0}
            
        df = hist.reset_index()
        df['date'] = pd.to_datetime(df['date']).dt.date
        
        # Sort by date
        df = df.sort_values('date').reset_index(drop=True)
        
        # Find index of Day 0 (closest available trading day to reported_date)
        if df.empty:
            return {"history": [], "base_price": 0.0}
            
        df['diff_days'] = df['date'].apply(lambda x: abs((x - reported_date).days))
        day_0_idx = int(df['diff_days'].idxmin())
        base_price = float(df.loc[day_0_idx, "adjclose"])
        
        # We need Day -10 to Day +10 relative index
        start_idx = max(0, day_0_idx - 10)
        end_idx = min(len(df) - 1, day_0_idx + 10)
        
        results = []
        for idx in range(start_idx, end_idx + 1):
            rel_day = idx - day_0_idx
            row_date = df.loc[idx, "date"]
            price = float(df.loc[idx, "adjclose"])
            return_pct = (price - base_price) / base_price if base_price > 0 else 0.0
            
            results.append({
                "day": rel_day,
                "date": str(row_date),
                "price": price,
                "return_pct": float(return_pct)
            })
            
        return {"history": results, "base_price": base_price}
    except Exception as e:
        print(f"Error fetching window prices for {symbol} on {reported_date_str}: {e}")
        return {"history": [], "base_price": 0.0}

def get_multiple_quarters_history(symbol: str, quarters_list: list) -> list:
    """
    Retrieves the 10-day window prices for multiple historical quarters.
    """
    quarters_data = []
    for q in quarters_list:
        reported_date_str = q.get("reported_date")
        if not reported_date_str:
            continue
        window = get_earnings_window_prices(symbol, reported_date_str)
        if window["history"]:
            quarters_data.append({
                "quarter": q.get("quarter"),
                "reported_date": reported_date_str,
                "base_price": window["base_price"],
                "data": window["history"]
            })
    return quarters_data
