import json
from datetime import datetime
from typing import Optional, Dict, Any, List
import random

from app.core.db import get_conn

# -----------------------------
# DB Initialization
# -----------------------------
def init_db():
    conn = get_conn()
    c = conn.cursor()

    # Users
    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        company_name TEXT,
        password_hash TEXT,
        auth_provider TEXT DEFAULT 'email',
        provider_id TEXT
    )
    """)

    c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS intent TEXT")
    c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT")
    c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS influence TEXT")
    c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS has_budget BOOLEAN DEFAULT FALSE")
    c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS budget_min NUMERIC")
    c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS budget_max NUMERIC")
    c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS budget_currency TEXT DEFAULT 'ZAR'")
    c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS comm_channel TEXT")
    c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS comm_hours TEXT")
    c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS intent_lifespan TEXT")
    c.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS photo TEXT")

    # Contact form submissions
    c.execute("""
    CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Sent Emails log table
    c.execute("""
    CREATE TABLE IF NOT EXISTS sent_emails (
        id SERIAL PRIMARY KEY,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # User Messages (inbox/outbox)
    c.execute("""
    CREATE TABLE IF NOT EXISTS user_messages (
        id SERIAL PRIMARY KEY,
        sender_id INT REFERENCES users(id) ON DELETE CASCADE,
        recipient_id INT REFERENCES users(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()

# -----------------------------
# Contact Messages
# -----------------------------
def log_contact_message(
    first_name: str,
    last_name: str,
    email: str,
    message: str,
    phone: str = None,
) -> int:
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        INSERT INTO contact_messages (first_name, last_name, email, phone, message)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (first_name, last_name, email, phone, message))
    row_id = c.fetchone()["id"]
    conn.commit()
    conn.close()
    return row_id


# -----------------------------
# Helpers
# -----------------------------
def build_description_from_attributes(attributes: dict) -> str:
    if not attributes:
        return ""
    parts = []
    for key, value in attributes.items():
        if key.lower() == "price" or value is None:
            continue
        parts.append(f"{key.replace('_', ' ').title()}: {value}")
    return ", ".join(parts)

def clean_price(raw_price):
    if raw_price is None:
        return 0.0
    if isinstance(raw_price, (int, float)):
        return float(raw_price)
    raw_price = str(raw_price).replace("R", "").replace(",", "").strip()
    if "-" in raw_price:
        raw_price = raw_price.split("-")[0].strip()
    try:
        return float(raw_price)
    except ValueError:
        return 0.0

# -----------------------------
# Search logs
# -----------------------------
def log_search(query, classification, attributes, common_items, client_info=None):
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        INSERT INTO search_logs (query, classification, attributes, common_items, client_info)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (
        query,
        json.dumps(classification),
        json.dumps(attributes),
        json.dumps(common_items),
        json.dumps(client_info) if client_info else None
    ))
    log_id = c.fetchone()['id']
    conn.commit()
    conn.close()
    return log_id

def get_all_searches():
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT id, query, classification, attributes, common_items, client_info, created_at
        FROM search_logs
        ORDER BY created_at DESC
    """)
    rows = c.fetchall()
    conn.close()
    searches = []
    for row in rows:
        searches.append({
            "log_id": row["id"],
            "query": row["query"],
            "classification": row["classification"],
            "attributes": row["attributes"],
            "common_items": row["common_items"],
            "client_info": row["client_info"],
            "created_at": row["created_at"]
        })
    return searches

# -----------------------------
# Quote Requests
# -----------------------------
def generate_quote_number():
    random_part = random.randint(1000, 9999)
    return f"QT-{random_part}"

def create_quote_request(first_name, last_name, email, phone, delivery_address, client_info=None):
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        INSERT INTO quotes_requests
        (first_name, last_name, email, phone, delivery_address, client_info, quote_no)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        first_name,
        last_name,
        email,
        phone,
        delivery_address,
        json.dumps(client_info) if client_info else None,
        generate_quote_number()
    ))
    quote_request_id = c.fetchone()['id']
    conn.commit()
    conn.close()
    return quote_request_id

def create_quote_item_request(quote_request_id, item_name, item_attributes, quantity, log_id):
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        INSERT INTO quote_items_requests
        (quote_request_id, item_name, item_attributes, quantity, log_id)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (
        quote_request_id,
        item_name,
        json.dumps(item_attributes) if item_attributes else None,
        quantity,
        log_id
    ))
    item_id = c.fetchone()['id']
    conn.commit()
    conn.close()
    return item_id

def get_all_quote_requests() -> List[Dict[str, Any]]:
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT *
        FROM quotes_requests
        ORDER BY id DESC
    """)
    quote_rows = c.fetchall()
    all_quotes = []

    for quote_request in quote_rows:
        if not quote_request.get("client_info"):
            quote_request["client_info"] = {}
        c.execute("""
            SELECT *
            FROM quote_items_requests
            WHERE quote_request_id = %s
            ORDER BY id ASC
        """, (quote_request["id"],))
        line_rows = c.fetchall()
        quote_request["lines"] = line_rows
        all_quotes.append(quote_request)

    conn.close()
    return all_quotes

def get_quote_request_by_id(quote_id: int) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM quotes_requests WHERE id = %s", (quote_id,))
    quote_request = c.fetchone()
    if not quote_request:
        conn.close()
        return None
    if not quote_request.get("client_info"):
        quote_request["client_info"] = {}
    c.execute("SELECT * FROM quote_items_requests WHERE quote_request_id = %s ORDER BY id ASC", (quote_id,))
    quote_request["lines"] = c.fetchall()
    conn.close()
    return quote_request

def get_quotes_by_phone(phone: str) -> List[Dict[str, Any]]:
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM quotes_requests WHERE phone = %s ORDER BY created_at DESC", (phone,))
    quote_rows = c.fetchall()
    quotes = []

    for quote in quote_rows:
        if not quote.get("client_info"):
            quote["client_info"] = {}
        c.execute("SELECT * FROM quote_items_requests WHERE quote_request_id = %s ORDER BY id ASC", (quote["id"],))
        quote["lines"] = c.fetchall()
        quotes.append(quote)

    conn.close()
    return quotes

def get_quote_request(quote_id: Optional[int] = None, quote_number: Optional[str] = None) -> Optional[Dict[str, Any]]:
    if not quote_id and not quote_number:
        return None
    conn = get_conn()
    c = conn.cursor()
    if quote_id:
        c.execute("SELECT * FROM quotes_requests WHERE id = %s", (quote_id,))
    else:
        c.execute("SELECT * FROM quotes_requests WHERE quote_no = %s", (quote_number,))
    quote_request = c.fetchone()
    if not quote_request:
        conn.close()
        return None
    if not quote_request.get("client_info"):
        quote_request["client_info"] = {}
    c.execute("SELECT * FROM quote_items_requests WHERE quote_request_id = %s ORDER BY id ASC", (quote_request["id"],))
    quote_request["lines"] = c.fetchall()
    conn.close()
    return quote_request

def get_quote_request_by_number(quote_number: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT a.*, b.* 
        FROM quotes_requests a
        LEFT JOIN quotes_sent b ON a.id = b.quote_id
        WHERE a.quote_no = %s
    """, (quote_number,))
    quote_request = c.fetchone()
    if not quote_request:
        conn.close()
        return None
    if not quote_request.get("client_info"):
        quote_request["client_info"] = {}
    c.execute("SELECT * FROM quote_items_requests WHERE quote_request_id = %s ORDER BY id ASC", (quote_request["id"],))
    quote_request["lines"] = c.fetchall()
    conn.close()
    return quote_request

def insert_or_update_quote(id=None, quote_id=None, quote_number=None, paid=False, price=0):
    conn = get_conn()
    c = conn.cursor()
    
    # Optional: remove old records (like your original SQLite code)
    # Comment out if you want multiple records
    # c.execute("DELETE FROM quotes_sent")

    # Update by quote_id
    if quote_id is not None:
        c.execute("SELECT id FROM quotes_sent WHERE quote_id = %s", (quote_id,))
        if c.fetchone():
            c.execute("""
                UPDATE quotes_sent
                SET quote_id = %s, quote_number = %s, paid = %s, price = %s
                WHERE quote_id = %s
            """, (quote_id, quote_number, paid, price, quote_id))
            conn.commit()
            conn.close()
            return quote_id

    # Update by quote_number
    if quote_number is not None:
        c.execute("SELECT id FROM quotes_sent WHERE quote_number = %s", (quote_number,))
        row = c.fetchone()
        if row:
            update_id = row['id']
            c.execute("""
                UPDATE quotes_sent
                SET quote_id = %s, paid = %s, price = %s
                WHERE id = %s
            """, (quote_id, paid, price, update_id))
            conn.commit()
            conn.close()
            return update_id

    # Insert new record
    c.execute("""
        INSERT INTO quotes_sent (quote_id, quote_number, paid, price)
        VALUES (%s, %s, %s, %s)
        RETURNING id
    """, (quote_id, quote_number, paid, price))
    new_id = c.fetchone()['id']
    conn.commit()
    conn.close()
    return new_id
