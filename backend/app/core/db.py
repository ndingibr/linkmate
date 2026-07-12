"""Shared database access.

Two consumers exist today:

* The quoting app uses raw ``psycopg2`` connections (``get_conn``).
* The earnings pipeline / read API use SQLAlchemy (``get_engine``).

Both now read the connection string from :mod:`app.core.config` instead of
hardcoding it, and the SQLAlchemy engine is pooled so it can handle concurrent
requests. Raw psycopg2 usage will be migrated onto the pool in a later step.
"""
from functools import lru_cache

import psycopg2
import psycopg2.extras
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

from app.core.config import settings


@lru_cache
def get_engine() -> Engine:
    """Return a cached, pooled SQLAlchemy engine."""
    return create_engine(
        settings.database_url,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
    )


def get_conn():
    """Return a new psycopg2 connection with dict-like rows."""
    return psycopg2.connect(
        settings.database_url,
        cursor_factory=psycopg2.extras.RealDictCursor,
    )
