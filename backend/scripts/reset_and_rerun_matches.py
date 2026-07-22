import sys
import os

# Add backend directory to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.db import get_conn
from app.log import init_db
from app.services.matching_service import run_matching_cycle

def reset_and_rerun():
    print("=== Resetting All Matches and Snapshot Data ===")
    
    # 0. Ensure all DB tables (including matches_history) exist
    init_db()
    
    conn = get_conn()
    c = conn.cursor()
    
    # 1. Truncate matches and history tables (dropping legacy snapshot table if exists)
    c.execute("DROP TABLE IF EXISTS matches_status_snapshot CASCADE;")
    c.execute("TRUNCATE matches, matches_history RESTART IDENTITY CASCADE;")
    
    # 2. Reset intent_vector to force fresh 768-dim embeddings for all active user intents
    c.execute("UPDATE user_intents SET intent_vector = NULL;")
    conn.commit()
    conn.close()
    
    print("[OK] Deleted all existing match records, snapshots, and reset vectors.")
    print("=== Starting Full Unlimited Matching Cycle ===")
    
    # 3. Trigger full matching cycle
    run_matching_cycle()
    
    # 4. Fetch created matches count
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as total FROM matches;")
    total_matches = c.fetchone()["total"]
    conn.close()
    
    print(f"=== Matching Complete! Total Fresh Matches Created: {total_matches} ===")

if __name__ == "__main__":
    reset_and_rerun()
