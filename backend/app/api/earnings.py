"""Earnings calendar (read-only) endpoints."""
from fastapi import APIRouter, HTTPException

from app.earnings_calendar import get_earnings_calendar

router = APIRouter(tags=["earnings"])


@router.get("/earnings_calendar")
async def earnings_calendar_endpoint(limit: int = 100, start_date: str = None, end_date: str = None):
    """
    Get earnings calendar data.

    Optional query params:
    - limit: max rows (default 100)
    - start_date: YYYY-MM-DD
    - end_date: YYYY-MM-DD
    """
    try:
        df = get_earnings_calendar(limit=limit, start_date=start_date, end_date=end_date)
        data = df.to_dict(orient="records")
        return {"count": len(data), "earnings": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
