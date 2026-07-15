import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import get_conn
from app.services.auth import hash_password

def main():
    print("Preparing matched B2B demo users...")
    
    conn = get_conn()
    c = conn.cursor()
    
    # 1. Fetch top match where score > 60
    c.execute("""
        SELECT 
            m.id as match_id,
            m.user_id_1,
            m.user_id_2,
            m.score,
            m.match_reason
        FROM matches m
        ORDER BY m.score DESC, m.created_at DESC
        LIMIT 1
    """)
    match = c.fetchone()
    
    if not match:
        print("No matches found in the database yet. Please ensure the matchmaking cycle has run.")
        conn.close()
        return
        
    user_id_1 = match["user_id_1"]
    user_id_2 = match["user_id_2"]
    
    print(f"Found match between User ID {user_id_1} and User ID {user_id_2} with score {match['score']}%")
    
    # 2. Reset passwords and activate users
    pwd_hash = hash_password("securepassword123")
    
    c.execute("""
        UPDATE users 
        SET password_hash = %s, is_active = TRUE 
        WHERE id IN (%s, %s)
    """, (pwd_hash, user_id_1, user_id_2))
    
    # Fetch details for display
    c.execute("SELECT id, first_name, last_name, email, company_name, role, intent FROM users WHERE id = %s", (user_id_1,))
    u1 = c.fetchone()
    
    c.execute("SELECT id, first_name, last_name, email, company_name, role, intent FROM users WHERE id = %s", (user_id_2,))
    u2 = c.fetchone()
    
    conn.commit()
    conn.close()
    
    print("\n" + "="*50)
    print("DEMO B2B MATCHED USERS CREDENTIALS")
    print("="*50)
    print(f"User 1: {u1['first_name']} {u1['last_name']} ({u1['company_name']})")
    print(f"  - Email: {u1['email']}")
    print(f"  - Password: securepassword123")
    print(f"  - Role: {u1['role']}")
    print(f"  - Intent: {u1['intent']}")
    print("-"*50)
    print(f"User 2: {u2['first_name']} {u2['last_name']} ({u2['company_name']})")
    print(f"  - Email: {u2['email']}")
    print(f"  - Password: securepassword123")
    print(f"  - Role: {u2['role']}")
    print(f"  - Intent: {u2['intent']}")
    print("="*50)
    print(f"Match Reason: {match['match_reason']}")
    print("="*50)
    print("\nLog in as either user on the website, go to Messages, and you will see the match carousel at the top!")

if __name__ == "__main__":
    main()
