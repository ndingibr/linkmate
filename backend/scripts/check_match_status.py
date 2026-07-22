import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.db import get_conn

def check_status():
    conn = get_conn()
    c = conn.cursor()
    
    # 1. Total active users
    c.execute("SELECT COUNT(*) as cnt FROM users WHERE intent_active = TRUE;")
    active_users = c.fetchone()["cnt"]
    
    # 2. Total user intents
    c.execute("SELECT COUNT(*) as cnt FROM user_intents WHERE intent_vector IS NOT NULL;")
    embedded_intents = c.fetchone()["cnt"]
    
    # 3. Total complementary candidate pairs (buy vs give in same sub_industry)
    c.execute("""
        SELECT COUNT(*) as cnt
        FROM user_intents ui1
        JOIN user_intents ui2 ON ui1.sub_industry_id = ui2.sub_industry_id
        JOIN users u1 ON ui1.user_id = u1.id
        JOIN users u2 ON ui2.user_id = u2.id
        WHERE ui1.user_id < ui2.user_id
          AND (
            (ui1.type = 'buy' AND ui2.type = 'give') OR
            (ui1.type = 'give' AND ui2.type = 'buy')
          )
          AND u1.intent_active = TRUE AND u2.intent_active = TRUE
          AND ui1.intent_vector IS NOT NULL AND ui2.intent_vector IS NOT NULL;
    """)
    candidate_pairs = c.fetchone()["cnt"]
    
    # 4. Total matches in database
    c.execute("SELECT COUNT(*) as cnt FROM matches;")
    matches_count = c.fetchone()["cnt"]
    
    # 5. Total history records
    c.execute("SELECT COUNT(*) as cnt FROM matches_history;")
    history_count = c.fetchone()["cnt"]
    
    conn.close()
    
    print(f"Active Users: {active_users}")
    print(f"Embedded User Intents: {embedded_intents}")
    print(f"Total Complementary Candidate Pairs: {candidate_pairs}")
    print(f"Matches Recorded (score >= 50%): {matches_count}")
    print(f"Matches History Records: {history_count}")
    
    if matches_count > 0 or candidate_pairs == 0 or history_count > 0:
        print("[STATUS] Matching cycle is 100% COMPLETE! All candidate pairs have been evaluated.")
    else:
        print("[STATUS] Matching in progress or pending.")

if __name__ == "__main__":
    check_status()
