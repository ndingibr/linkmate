import sys
import os

# Add parent dir to path so we can import app and main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.matching_service import run_matching_cycle
from app.core.db import get_conn

def generate_report():
    print("Running matchmaking evaluation cycle...")
    run_matching_cycle()
    print("Matchmaking evaluation complete!")
    
    print("Fetching matches for report...")
    conn = get_conn()
    c = conn.cursor()
    
    # Query top matches
    c.execute("""
        SELECT 
            m.id as match_id,
            u1.first_name || ' ' || u1.last_name as user_1,
            u1.company_name as company_1,
            u2.first_name || ' ' || u2.last_name as user_2,
            u2.company_name as company_2,
            m.score,
            m.match_reason
        FROM matches m
        JOIN users u1 ON m.user_id_1 = u1.id
        JOIN users u2 ON m.user_id_2 = u2.id
        ORDER BY m.score DESC, m.created_at DESC
        LIMIT 30
    """)
    rows = c.fetchall()
    conn.close()
    
    # Generate markdown report
    report_content = """# B2B Segment Matchmaking Evaluation Report

We have successfully executed the segment-based B2B matchmaking algorithm over the newly backfilled user database. 

## Matching Strategy
1. **Hard Filtering by Sub-Industry**: Candidates are only eligible for comparison if they are classified under the **exact same sub-industry**.
2. **Complementary Type Routing**: A match is only created if one user is a seeker (`buy`) and the other is an offeror (`give`).
3. **pgvector Similarity Search**: Candidates are pre-filtered and ordered based on the cosine distance of their AI-generated intent embeddings.
4. **LLM Evaluation**: The top segment intentions are evaluated by `gpt-4o-mini` to compute a combined matching score and generate natural text explaining why they are compatible.

---

## Top B2B Matches Found

| Match ID | User 1 (Seeker/Offeror) | User 2 (Opposite) | Compatibility Score | Match Reasoning / Synergies |
| :--- | :--- | :--- | :---: | :--- |
"""
    for r in rows:
        reason = r["match_reason"].replace("\n", " ").strip()
        report_content += f"| {r['match_id']} | **{r['user_1']}** ({r['company_1']}) | **{r['user_2']}** ({r['company_2']}) | `{r['score']}%` | {reason} |\n"
        
    report_path = r"C:\Users\User\.gemini\antigravity\brain\c306080b-740d-4f60-a1a0-a45a767b5986\matches_results.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)
        
    print(f"Report generated successfully at: {report_path}")

if __name__ == "__main__":
    generate_report()
