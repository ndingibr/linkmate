import datetime
import json
from typing import List, Dict, Any, Optional
from app.ai import client, MODEL, parse_json_response
from app.earnings_analyzer import get_earnings_window_prices, get_multiple_quarters_history
from app.repositories import earnings_repo

def screen_candidates(limit: int = 10) -> List[Dict[str, Any]]:
    """
    Screens upcoming earnings candidates by asking OpenAI (GPT-4o-mini)
    to identify the top liquid companies reporting earnings in the next 10 days
    that are historically most likely to rally. Caches results daily in the database.
    """
    today = datetime.date.today()
    today_str = today.strftime("%Y-%m-%d")
    
    # 1. Try to fetch from database repository cache
    cached = earnings_repo.get_cached_screened_candidates(today)
    if cached:
        print(f"Retrieving {limit} candidates for {today_str} from repository cache.")
        return cached[:limit]

    # 2. Cache miss: Query OpenAI
    print(f"Cache miss. Asking OpenAI for upcoming earnings rally candidates relative to {today_str}...")
    system_prompt = (
        "You are an expert quantitative stock market analyst and trade screener. "
        "Your job is to identify companies with upcoming earnings announcements that are "
        "most likely to experience a positive stock price rally (post-earnings drift or pre-earnings runup)."
    )
    
    user_prompt = f"""
    Today is {today_str}.
    Identify {limit} real public companies scheduled to report corporate earnings in the next 10 days (or the nearest upcoming dates in July/August 2026) that are historically most likely to experience a post-earnings drift or rally.
    
    For each of the {limit} companies, you must return:
    1. "symbol": The ticker symbol (e.g., TSLA, NFLX, MSFT).
    2. "company_name": The company name (e.g., Tesla Inc., Netflix Inc.).
    3. "earnings_date": The scheduled earnings calendar date in YYYY-MM-DD format (must be on or after today's date {today_str}).
    4. "win_rate": A float between 0.0 and 1.0 representing the historical probability of a positive post-earnings drift (e.g. 0.75 for 75%).
    5. "avg_gain": A float representing the average percentage gain observed in positive drift cycles (e.g. 0.065 for a 6.5% gain).
    6. "score": A float representing the opportunity score, calculated as win_rate * avg_gain (e.g. 0.048).
    7. "current_price": A float representing the approximate current stock price (e.g. 245.50).
    8. "history": A list of exactly 3 past quarters representing historical price response data. Each quarter object must contain:
       - "quarter": A string label (e.g., "1Q2026", "4Q2025").
       - "reported_date": A YYYY-MM-DD date representing when that quarter reported earnings.
       - "change_pct": A float representing the post-earnings return percentage (e.g. 0.052 for 5.2%).
       
    Return JSON ONLY with a root key "candidates" containing this list of candidates. Do not wrap in markdown blocks, just raw JSON.
    """
    
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2
        )
        res_data = parse_json_response(response.choices[0].message.content)
        candidates = res_data.get("candidates", [])
        if candidates:
            # Save candidates to cache
            earnings_repo.save_cached_screened_candidates(today, candidates)
            print(f"Saved {len(candidates)} candidates to repository cache for {today_str}.")
            return candidates[:limit]
    except Exception as e:
        print(f"Error querying OpenAI for candidates: {e}")
        
    # Fallback if OpenAI call fails
    return [
        {
            "symbol": "NFLX",
            "company_name": "Netflix Inc.",
            "earnings_date": today_str,
            "win_rate": 0.75,
            "avg_gain": 0.08,
            "score": 0.06,
            "current_price": 620.50,
            "history": [
                {"quarter": "1Q2026", "reported_date": "2026-04-18", "change_pct": 0.065},
                {"quarter": "4Q2025", "reported_date": "2026-01-20", "change_pct": 0.078},
                {"quarter": "3Q2025", "reported_date": "2025-10-16", "change_pct": -0.015}
            ]
        }
    ][:limit]

def analyze_candidate_by_symbol(symbol: str) -> Dict[str, Any]:
    """
    Look up the candidate from today's cached candidate list in the database
    by its symbol, and run the detailed trade forecast and actual return calculation.
    """
    today = datetime.date.today()
    candidates = earnings_repo.get_cached_screened_candidates(today)
    
    # If candidates list is not cached yet, screen them now
    if not candidates:
        candidates = screen_candidates(limit=10)
        
    cand = next((c for c in candidates if c["symbol"].upper() == symbol.upper()), None)
    if not cand:
        raise ValueError(f"Ticker symbol '{symbol}' was not found in today's candidates list.")
        
    return analyze_candidate(
        symbol=cand["symbol"],
        company_name=cand["company_name"],
        earnings_date_str=cand["earnings_date"],
        rally_probability=cand["win_rate"],
        history=cand["history"]
    )

def analyze_candidate(
    symbol: str,
    company_name: str,
    earnings_date_str: str,
    rally_probability: float,
    history: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Perform 2-week lookback around past earnings, query LLM for forecast/optimization,
    resolve actual returns, save to repository, and return results.
    """
    # 1. Fetch 10-day window prices for all historical quarters
    history_quarters = get_multiple_quarters_history(symbol, history)
    if not history_quarters:
        raise ValueError(f"Could not retrieve historical price data for symbol {symbol}.")

    # 2. Run the LLM Trade Optimizer
    formatted_history = ""
    for idx, quarter in enumerate(history_quarters):
        q_label = quarter.get("quarter", f"Quarter {idx+1}")
        rep_date = quarter.get("reported_date", "Unknown")
        base_price = quarter.get("base_price", 100.0)
        
        return_sequence = ", ".join([
            f"Day {d['day']}: {d['return_pct']:.2%}"
            for d in quarter.get("data", [])
        ])
        
        formatted_history += f"--- {q_label} (Reported: {rep_date}, Base Price: ${base_price:.2f}) ---\n"
        formatted_history += f"Relative Return Sequence: {return_sequence}\n\n"

    system_prompt = (
        "You are an expert quantitative stock market analyst and trade optimizer. "
        "Your task is to analyze historical stock price patterns around corporate earnings announcements "
        "and determine the absolute best trade entry and exit strategies to maximize gains."
    )

    user_prompt = f"""
    We are analyzing upcoming earnings for {company_name} ({symbol}) scheduled on {earnings_date_str}.
    We tracked the stock's closing price actions 2 weeks before (10 trading days) and 2 weeks after (10 trading days) earnings announcements for the past quarters.

    Here is the historical relative price performance (Day -10 to Day +10 relative to the announcement day Close):
    {formatted_history}

    Please analyze this data and predict the trade trajectory for the upcoming earnings cycle.

    Return JSON ONLY with the following exact keys:
    1. "predicted_trajectory": A list of 10 floating point numbers representing the predicted cumulative return percentages for Day +1 to Day +10 relative to the upcoming earnings day Close.
    2. "optimal_entry_day": An integer between -10 and +10 representing the optimal relative trading day to buy the stock.
    3. "optimal_exit_day": An integer between -10 and +10 representing the optimal relative trading day to sell/exit.
    4. "expected_return_pct": A float representing the forecasted net percentage return of this optimized trade.
    5. "llm_reasoning": A detailed text paragraph explaining the pattern, your entry/exit picks, and market drivers.
    
    JSON output:
    """

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0
    )
    forecast = parse_json_response(response.choices[0].message.content)

    # 3. Resolve actual trajectory
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
            day_exit_row = next((x for x in valid_actuals if x["day"] == forecast["optimal_exit_day"]), None)
            if day_0_row and day_exit_row:
                actual_return_pct = (day_exit_row["price"] - day_0_row["price"]) / day_0_row["price"]

    # 4. Save to Repository
    earnings_date = datetime.datetime.strptime(earnings_date_str, "%Y-%m-%d").date()
    row_id = earnings_repo.save_earnings_rally_prediction(
        symbol=symbol,
        company_name=company_name,
        earnings_date=earnings_date,
        predicted_trajectory=forecast["predicted_trajectory"],
        optimal_entry_day=forecast["optimal_entry_day"],
        optimal_exit_day=forecast["optimal_exit_day"],
        expected_return_pct=forecast["expected_return_pct"],
        rally_probability=rally_probability,
        llm_reasoning=forecast["llm_reasoning"],
        actual_trajectory=actual_trajectory,
        actual_return_pct=actual_return_pct
    )

    return {
        "status": "success",
        "prediction_id": row_id,
        "forecast": forecast,
        "actuals": actual_trajectory,
        "actual_return_pct": actual_return_pct
    }

def query_trade_assistant(query: str, active_symbol: Optional[str] = None) -> str:
    """
    Constructs predictions context from repository and answers user query about forecasts.
    """
    predictions = earnings_repo.get_all_earnings_rally_predictions()
    
    # Format predictions database context
    context_list = []
    from datetime import datetime, timedelta
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    for r in predictions:
        earnings_date_str = r["earnings_date"]
        entry_day = r["optimal_entry_day"]
        exit_day = r["optimal_exit_day"]
        
        entry_date_str = None
        exit_date_str = None
        try:
            ed = datetime.strptime(earnings_date_str, "%Y-%m-%d")
            if entry_day is not None:
                entry_date_str = (ed + timedelta(days=int(entry_day))).strftime("%Y-%m-%d")
            if exit_day is not None:
                exit_date_str = (ed + timedelta(days=int(exit_day))).strftime("%Y-%m-%d")
        except Exception:
            pass
            
        context_list.append({
            "symbol": r["symbol"],
            "company_name": r["company_name"],
            "earnings_date": earnings_date_str,
            "predicted_trajectory": r["predicted_trajectory"],
            "optimal_entry_day": entry_day,
            "optimal_exit_day": exit_day,
            "entry_calendar_date": entry_date_str,
            "exit_calendar_date": exit_date_str,
            "expected_return_pct": float(r["expected_return_pct"]),
            "rally_probability": float(r["rally_probability"]),
            "llm_reasoning": r["llm_reasoning"],
            "actual_return_pct": r["actual_return_pct"]
        })
        
    context_str = json.dumps(context_list, indent=2)
    
    system_prompt = (
        f"You are the VentureAI Trade Assistant. Today's date is {today_str}. "
        "Your job is to answer user questions about corporate "
        "earnings rally forecasts, optimal trade entry/exit days, expected returns, and historical win rates. "
        "Each prediction record includes 'entry_calendar_date' and 'exit_calendar_date' which are the actual "
        "calendar dates computed from earnings_date + optimal_entry_day and earnings_date + optimal_exit_day. "
        "When the user asks which company has entry day today, compare entry_calendar_date to today's date. "
        "When the user asks about exit dates, use exit_calendar_date. "
        "Use the provided predictions database context to formulate factual, concise, and helpful answers. "
        "If the user asks about a ticker not present in the context, tell them to analyze it first by tapping on the company card. "
        f"Here is the database predictions context:\n{context_str}"
    )
    
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ],
        temperature=0.3
    )
    return response.choices[0].message.content
