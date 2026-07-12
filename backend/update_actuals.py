import datetime
import json
from app.core.db import get_conn
from app.earnings_analyzer import get_earnings_window_prices

def main():
    print("Connecting to database...")
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT id, symbol, company_name, earnings_date, predicted_trajectory, 
               optimal_entry_day, optimal_exit_day, expected_return_pct, 
               rally_probability, llm_reasoning, actual_trajectory, actual_return_pct
        FROM earnings_rally_predictions
    """)
    rows = c.fetchall()
    print(f"Found {len(rows)} predictions in database.")
    
    for r in rows:
        symbol = r["symbol"]
        earnings_date_str = str(r["earnings_date"])
        optimal_exit_day = r["optimal_exit_day"]
        
        print(f"Updating actuals for {symbol} on {earnings_date_str}...")
        actuals_data = get_earnings_window_prices(symbol, earnings_date_str)
        
        actual_trajectory = None
        actual_return_pct = None
        
        if actuals_data["history"]:
            today = datetime.date.today()
            valid_actuals = []
            for d in actuals_data["history"]:
                row_date = datetime.datetime.strptime(d["date"], "%Y-%m-%d").date()
                if row_date <= today:
                    valid_actuals.append(d)
            if valid_actuals:
                actual_trajectory = valid_actuals
                day_0_row = next((x for x in valid_actuals if x["day"] == 0), None)
                day_exit_row = next((x for x in valid_actuals if x["day"] == optimal_exit_day), None)
                if day_0_row and day_exit_row:
                    actual_return_pct = (day_exit_row["price"] - day_0_row["price"]) / day_0_row["price"]
        
        c.execute("""
            UPDATE earnings_rally_predictions
            SET actual_trajectory = %s,
                actual_return_pct = %s
            WHERE id = %s
        """, (
            json.dumps(actual_trajectory) if actual_trajectory else None,
            actual_return_pct,
            r["id"]
        ))
        print(f"Successfully updated {symbol}: {len(actual_trajectory) if actual_trajectory else 0} actual trading days saved.")
        
    conn.commit()
    conn.close()
    print("Database update complete!")

if __name__ == "__main__":
    main()
