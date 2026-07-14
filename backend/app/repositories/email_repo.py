from typing import List, Dict, Any, Optional
from app.core.db import get_conn

def log_sent_email(recipient: str, subject: str, body: str, status: str, error_message: Optional[str] = None) -> Dict[str, Any]:
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        INSERT INTO sent_emails (recipient, subject, body, status, error_message)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, recipient, subject, body, status, error_message, sent_at
    """, (recipient, subject, body, status, error_message))
    row = c.fetchone()
    conn.commit()
    conn.close()
    return dict(row) if row else {}

def get_sent_emails_by_recipient(recipient: str) -> List[Dict[str, Any]]:
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT id, recipient, subject, body, status, error_message, sent_at
        FROM sent_emails
        WHERE recipient = %s
        ORDER BY sent_at DESC
    """, (recipient,))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_all_sent_emails(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT id, recipient, subject, body, status, error_message, sent_at
        FROM sent_emails
        ORDER BY sent_at DESC
        LIMIT %s
    """, (limit,))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]
