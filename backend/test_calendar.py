from yahooquery import Ticker
import datetime

tickers = Ticker(["AAPL", "MSFT", "GOOGL", "TSLA", "NFLX", "JPM", "GILD"])
cal = tickers.calendar_events
print("Calendar Events RAW:")
for sym, data in cal.items():
    if isinstance(data, dict) and "earnings" in data:
        dates = data["earnings"].get("earningsDate", [])
        print(f"  {sym}: {dates} (type: {[type(x) for x in dates]})")
    else:
        print(f"  {sym}: Error or no calendar events: {data}")
