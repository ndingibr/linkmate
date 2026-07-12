"""Read access to the earnings calendar table.

The table is populated by the daily data pipeline. This module only reads it;
the database connection comes from :mod:`app.core.db`, so nothing is hardcoded.
"""
import pandas as pd
from sqlalchemy import text

from app.core.db import get_engine


def get_earnings_calendar(
    limit: int = 100,
    start_date: str = None,
    end_date: str = None,
) -> pd.DataFrame:
    """Return earnings calendar rows, most recent first.

    Optional ``start_date`` / ``end_date`` are ``YYYY-MM-DD`` strings; ``limit``
    caps the number of rows returned. Parameters are bound (no string
    interpolation) to avoid SQL injection.
    """
    query = (
        "SELECT date, symbol, company, epsforecast, time, marketcap "
        "FROM earnings_calendar"
    )

    filters = []
    params = {}
    if start_date:
        filters.append("date >= :start_date")
        params["start_date"] = start_date
    if end_date:
        filters.append("date <= :end_date")
        params["end_date"] = end_date
    if filters:
        query += " WHERE " + " AND ".join(filters)

    query += " ORDER BY date DESC"

    if limit:
        query += " LIMIT :limit"
        params["limit"] = limit

    with get_engine().connect() as conn:
        return pd.read_sql(text(query), conn, params=params)
