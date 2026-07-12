import sqlite3
import json

DB_FILE = "search_logs.db"

# -----------------------------
# Fetch search logs
# -----------------------------
def fetch_search_logs(limit=100):
    """
    Fetch the latest search logs from the database.

    Args:
        limit (int): Maximum number of logs to fetch.

    Returns:
        List[dict]: List of search log entries with JSON fields parsed.
    """
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    query = f"""
        SELECT
            id,
            query,
            classification,
            attributes,
            common_items,
            client_info,
            created_at
        FROM search_logs
        ORDER BY created_at DESC
        LIMIT {limit}
    """
    
    c.execute(query)
    rows = c.fetchall()
    conn.close()
    
    # Convert JSON fields back to Python objects
    logs = []
    for row in rows:
        logs.append({
            "id": row[0],
            "query": row[1],
            "classification": json.loads(row[2]) if row[2] else None,
            "attributes": json.loads(row[3]) if row[3] else None,
            "common_items": json.loads(row[4]) if row[4] else None,
            "client_info": json.loads(row[5]) if row[5] else None,
            "created_at": row[6]
        })
    
    return logs

# -----------------------------
# Example usage
# -----------------------------
if __name__ == "__main__":
    logs = fetch_search_logs(limit=10)
    for log in logs:
        print(json.dumps(log, indent=4))
