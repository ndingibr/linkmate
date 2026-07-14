from typing import List, Dict, Any, Optional
from app.core.db import get_conn

def create_message(sender_id: int, recipient_id: int, subject: str, body: str) -> Dict[str, Any]:
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        INSERT INTO user_messages (sender_id, recipient_id, subject, body, is_read)
        VALUES (%s, %s, %s, %s, FALSE)
        RETURNING id, sender_id, recipient_id, subject, body, is_read, sent_at
    """, (sender_id, recipient_id, subject, body))
    row = c.fetchone()
    conn.commit()
    conn.close()
    return dict(row) if row else {}

def get_inbox_messages(recipient_id: int) -> List[Dict[str, Any]]:
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT m.id, m.sender_id, m.recipient_id, m.subject, m.body, m.is_read, m.sent_at,
               u.first_name as sender_first_name, u.last_name as sender_last_name, u.company_name as sender_company, u.photo as sender_photo
        FROM user_messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.recipient_id = %s
        ORDER BY m.sent_at DESC
    """, (recipient_id,))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_sent_messages(sender_id: int) -> List[Dict[str, Any]]:
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT m.id, m.sender_id, m.recipient_id, m.subject, m.body, m.is_read, m.sent_at,
               u.first_name as recipient_first_name, u.last_name as recipient_last_name, u.company_name as recipient_company, u.photo as recipient_photo
        FROM user_messages m
        JOIN users u ON m.recipient_id = u.id
        WHERE m.sender_id = %s
        ORDER BY m.sent_at DESC
    """, (sender_id,))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def mark_as_read(message_id: int, recipient_id: int) -> bool:
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        UPDATE user_messages
        SET is_read = TRUE
        WHERE id = %s AND recipient_id = %s
    """, (message_id, recipient_id))
    conn.commit()
    rows_updated = c.rowcount > 0
    conn.close()
    return rows_updated
