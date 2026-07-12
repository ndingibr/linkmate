import asyncio
import datetime
from app.services.earnings_service import screen_candidates, analyze_candidate
from app.repositories import earnings_repo

async def run_daily_update():
    """Runs the daily screening and pre-analysis for the top 10 candidates."""
    today = datetime.date.today()
    today_str = today.strftime("%Y-%m-%d")
    print(f"[{datetime.datetime.now()}] Running daily scheduled screening and analysis for {today_str}...")
    try:
        # 1. Screen candidates (fetches and saves top 10 to DB cache)
        candidates = screen_candidates(limit=10)
        print(f"Screened {len(candidates)} candidates. Starting pre-analysis runs...")
        
        # 2. Run detailed analysis and trajectory forecasts for each candidate in the background
        for cand in candidates:
            symbol = cand["symbol"]
            print(f"Pre-analyzing forecast for {symbol}...")
            try:
                analyze_candidate(
                    symbol=cand["symbol"],
                    company_name=cand["company_name"],
                    earnings_date_str=cand["earnings_date"],
                    rally_probability=cand["win_rate"],
                    history=cand["history"]
                )
                print(f"Successfully pre-analyzed {symbol}.")
            except Exception as cand_err:
                print(f"Failed to pre-analyze {symbol} in background: {cand_err}")
                
        print(f"[{datetime.datetime.now()}] Daily scheduled screening and analysis completed successfully!")
    except Exception as e:
        print(f"[{datetime.datetime.now()}] Error during daily background run: {e}")

async def start_scheduler():
    """Startup background worker loop that runs daily at 20:00 (8:00 PM) local time."""
    print("Background trade-caching scheduler worker started.")
    
    # Run once immediately on startup if today's candidates are not cached yet
    try:
        today = datetime.date.today()
        cached = earnings_repo.get_cached_screened_candidates(today)
        if not cached:
            print("No cached candidates found for today at startup. Running immediate initialization task...")
            asyncio.create_task(run_daily_update())
    except Exception as startup_err:
        print(f"Failed to run startup initialization: {startup_err}")
        
    while True:
        now = datetime.datetime.now()
        # Set target run time to 20:00 (8:00 PM) local time
        target = now.replace(hour=20, minute=0, second=0, microsecond=0)
        if now > target:
            target += datetime.timedelta(days=1)
            
        delay = (target - now).total_seconds()
        print(f"Next background cache refresh scheduled in {delay/3600:.2f} hours at {target}.")
        
        await asyncio.sleep(delay)
        await run_daily_update()
