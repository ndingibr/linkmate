import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.db import get_conn

def cleanup_test_users():
    emails = ['brian.ndingindwayo@iwyze.co.za', 'ndingibr@gmail.com']
    print(f"=== Cleaning up user accounts and associated records for: {emails} ===")
    
    conn = get_conn()
    c = conn.cursor()
    
    # 1. Delete user intents
    c.execute("""
        DELETE FROM user_intents 
        WHERE user_id IN (
            SELECT id FROM users 
            WHERE email IN (%s, %s)
        );
    """, (emails[0], emails[1]))
    intents_deleted = c.rowcount
    
    # 2. Delete user messages (sender or recipient)
    c.execute("""
        DELETE FROM user_messages 
        WHERE sender_id IN (
            SELECT id FROM users 
            WHERE email IN (%s, %s)
        ) OR recipient_id IN (
            SELECT id FROM users 
            WHERE email IN (%s, %s)
        );
    """, (emails[0], emails[1], emails[0], emails[1]))
    messages_deleted = c.rowcount
    
    # 3. Delete matches
    c.execute("""
        DELETE FROM matches 
        WHERE user_id_1 IN (
            SELECT id FROM users 
            WHERE email IN (%s, %s)
        ) OR user_id_2 IN (
            SELECT id FROM users 
            WHERE email IN (%s, %s)
        );
    """, (emails[0], emails[1], emails[0], emails[1]))
    matches_deleted = c.rowcount
    
    # 4. Delete matches_history
    c.execute("""
        DELETE FROM matches_history 
        WHERE user_1_id IN (
            SELECT id FROM users 
            WHERE email IN (%s, %s)
        ) OR user_2_id IN (
            SELECT id FROM users 
            WHERE email IN (%s, %s)
        );
    """, (emails[0], emails[1], emails[0], emails[1]))
    history_deleted = c.rowcount
    
    # 5. Delete users
    c.execute("""
        DELETE FROM users 
        WHERE email IN (%s, %s);
    """, (emails[0], emails[1]))
    users_deleted = c.rowcount
    
    conn.commit()
    conn.close()
    
    print(f"[OK] Cleaned up records:")
    print(f"  - Intention Statements Deleted: {intents_deleted}")
    print(f"  - Inbox Messages Deleted: {messages_deleted}")
    print(f"  - Match Pairs Deleted: {matches_deleted}")
    print(f"  - Match History Records Deleted: {history_deleted}")
    print(f"  - User Accounts Deleted: {users_deleted}")
    print("=== Cleanup Complete ===")

if __name__ == "__main__":
    cleanup_test_users()
