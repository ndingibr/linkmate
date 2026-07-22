from typing import Optional, Dict, Any
from app.core.db import get_conn

def create_user(
    first_name: str,
    last_name: str,
    email: str,
    phone: Optional[str] = None,
    company_name: Optional[str] = None,
    password_hash: Optional[str] = None,
    auth_provider: str = 'email',
    provider_id: Optional[str] = None,
    is_active: bool = False
) -> Dict[str, Any]:
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        INSERT INTO users (first_name, last_name, email, phone, company_name, password_hash, auth_provider, provider_id, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id, first_name, last_name, email, phone, company_name, auth_provider, is_active, created_at, updated_at, photo
    """, (first_name, last_name, email, phone, company_name, password_hash, auth_provider, provider_id, is_active))
    user = c.fetchone()
    conn.commit()
    conn.close()
    return dict(user) if user else {}

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT id, first_name, last_name, email, phone, company_name, password_hash, auth_provider, provider_id, is_active, created_at, updated_at, intent, role, influence, has_budget, budget_min, budget_max, budget_currency, comm_channel, comm_hours, intent_lifespan, location, intent_active, photo, company_verified
        FROM users
        WHERE email = %s
    """, (email,))
    user = c.fetchone()
    conn.close()
    return dict(user) if user else None

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT id, first_name, last_name, email, phone, company_name, password_hash, auth_provider, provider_id, is_active, created_at, updated_at, intent, role, influence, has_budget, budget_min, budget_max, budget_currency, comm_channel, comm_hours, intent_lifespan, location, intent_active, photo, company_verified
        FROM users
        WHERE id = %s
    """, (user_id,))
    user = c.fetchone()
    conn.close()
    return dict(user) if user else None

def get_user_by_provider(provider: str, provider_id: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT id, first_name, last_name, email, phone, company_name, password_hash, auth_provider, provider_id, is_active, created_at, updated_at, intent, role, influence, has_budget, budget_min, budget_max, budget_currency, comm_channel, comm_hours, intent_lifespan, location, intent_active, photo, company_verified
        FROM users
        WHERE auth_provider = %s AND provider_id = %s
    """, (provider, provider_id))
    user = c.fetchone()
    conn.close()
    return dict(user) if user else None

def email_exists(email: str) -> bool:
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT 1 FROM users WHERE email = %s", (email,))
    exists = c.fetchone() is not None
    conn.close()
    return exists

def update_user(user_id: int, **fields) -> Optional[Dict[str, Any]]:
    if not fields:
        return get_user_by_id(user_id)
    
    set_clause = []
    values = []
    for k, v in fields.items():
        set_clause.append(f"{k} = %s")
        values.append(v)
    
    set_clause.append("updated_at = CURRENT_TIMESTAMP")
    values.append(user_id)
    
    query = f"""
        UPDATE users
        SET {', '.join(set_clause)}
        WHERE id = %s
        RETURNING id, first_name, last_name, email, phone, company_name, auth_provider, is_active, created_at, updated_at, intent, role, influence, has_budget, budget_min, budget_max, budget_currency, comm_channel, comm_hours, intent_lifespan, location, intent_active, photo
    """
    
    conn = get_conn()
    c = conn.cursor()
    c.execute(query, tuple(values))
    user = c.fetchone()
    conn.commit()
    conn.close()
    return dict(user) if user else None

def delete_user_by_email(email: str) -> None:
    conn = get_conn()
    c = conn.cursor()
    c.execute("DELETE FROM users WHERE email = %s", (email,))
    conn.commit()
    conn.close()


def create_otp(email: str, code: str, purpose: str) -> None:
    from datetime import datetime, timedelta
    conn = get_conn()
    c = conn.cursor()
    # Delete older OTPs for same email & purpose
    c.execute("DELETE FROM user_otps WHERE email = %s AND purpose = %s", (email, purpose))
    
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    c.execute("""
        INSERT INTO user_otps (email, otp_code, purpose, expires_at)
        VALUES (%s, %s, %s, %s)
    """, (email, code, purpose, expires_at))
    conn.commit()
    conn.close()


def verify_otp(email: str, code: str, purpose: str) -> bool:
    from datetime import datetime
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT 1 FROM user_otps
        WHERE email = %s AND otp_code = %s AND purpose = %s AND expires_at > %s
    """, (email, code, purpose, datetime.utcnow()))
    valid = c.fetchone() is not None
    conn.close()
    return valid


def delete_otp(email: str, purpose: str) -> None:
    conn = get_conn()
    c = conn.cursor()
    c.execute("DELETE FROM user_otps WHERE email = %s AND purpose = %s", (email, purpose))
    conn.commit()
    conn.close()
