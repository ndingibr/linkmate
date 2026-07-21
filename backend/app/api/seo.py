from fastapi import APIRouter, Query, HTTPException
from app.core.db import get_conn
import json
import requests

router = APIRouter(prefix="/seo", tags=["seo"])

@router.get("/landing")
def get_seo_landing_copy(keyword: str = Query(..., description="The Google search landing keyword")):
    clean_keyword = keyword.strip().lower()
    default_what_to_look_for = [
        "Verified operational credentials and verified identity status",
        "Direct alignment of business requirements and capability scoring",
        "Active circle membership and rapid response history for introductions"
    ]

    if not clean_keyword:
        return {
            "phrase": "",
            "canonical_term": "",
            "intent": "",
            "heading": "What does your business need today?",
            "description": "Tell us what you're looking for - or what your business offers - in plain language. We'll introduce you directly to compatible companies and the right decision-maker, bypassing the gatekeepers and starting straight with a warm conversation.",
            "pre_fill": 'e.g. "Looking for food packaging suppliers in Gauteng..."',
            "what_to_look_for": default_what_to_look_for
        }

    conn = get_conn()
    c = conn.cursor()
    row = None

    try:
        # 1. Try Exact match
        c.execute("""
            SELECT phrase, canonical_term, intent, heading, description, pre_fill, what_to_look_for 
            FROM seo_keywords 
            WHERE LOWER(phrase) = %s
        """, (clean_keyword,))
        row = c.fetchone()

        # 2. Try Case-insensitive ILIKE match
        if not row:
            c.execute("""
                SELECT phrase, canonical_term, intent, heading, description, pre_fill, what_to_look_for 
                FROM seo_keywords 
                WHERE phrase ILIKE %s 
                LIMIT 1
            """, (f"%{clean_keyword}%",))
            row = c.fetchone()

        # 3. Try Word-by-word token fallback match
        if not row:
            words = [w for w in clean_keyword.split() if len(w) > 3]
            if words:
                like_clauses = " OR ".join(["phrase ILIKE %s" for _ in words])
                query = f"""
                    SELECT phrase, canonical_term, intent, heading, description, pre_fill, what_to_look_for 
                    FROM seo_keywords 
                    WHERE {like_clauses} 
                    ORDER BY search_volume DESC 
                    LIMIT 1
                """
                c.execute(query, tuple([f"%{w}%" for w in words]))
                row = c.fetchone()

        # Format database row if found
        if row:
            # Parse what_to_look_for JSON
            try:
                wtlf = json.loads(row["what_to_look_for"]) if row.get("what_to_look_for") else default_what_to_look_for
                if not isinstance(wtlf, list) or len(wtlf) == 0:
                    wtlf = default_what_to_look_for
            except Exception:
                wtlf = default_what_to_look_for
                
            return {
                "phrase": row["phrase"],
                "canonical_term": row["canonical_term"],
                "intent": row["intent"],
                "heading": row["heading"],
                "description": row["description"],
                "pre_fill": row["pre_fill"],
                "what_to_look_for": wtlf
            }

        # 4. If still not found, call local Ollama model (Llama3.1) to generate copy dynamically!
        if not row:
            print(f"No match found for '{keyword}' in database. Invoking local Llama3.1...")
            prompt = f"""You are a professional copywriter for LinkMate, a business partner introduction platform.
Generate landing page copy for the following search term: "{keyword}".
Your response MUST be a raw JSON object with exactly four fields (no markdown, no backticks, no other text):
{{
  "heading": "A short, professional title targeting this query, e.g., 'Looking for a verified [term]?' or 'Connect with [term] Partners'",
  "description": "A descriptive paragraph explaining how LinkMate introduces the visitor directly to compatible business partners, suppliers, or strategic joint venture connections matching this request.",
  "pre_fill": "A clean search query to pre-fill their search box, e.g., 'Need [term] services' or 'Looking for [term] in South Africa'",
  "what_to_look_for": [
    "A list of exactly 3-4 professional key evaluation criteria or vetting points specific to selecting this type of partner"
  ]
}}"""
            try:
                response = requests.post(
                    "http://localhost:11434/api/generate",
                    json={
                        "model": "llama3.1:latest",
                        "prompt": prompt,
                        "stream": False,
                        "format": "json"
                    },
                    timeout=8.0
                )
                if response.status_code == 200:
                    res_data = response.json()
                    parsed = json.loads(res_data.get("response", "{}"))
                    
                    heading = parsed.get("heading", f"Connect with a verified {keyword.title()}")
                    description = parsed.get("description", f"Find trusted partners and service providers for {keyword} in our verified business network. Skip the gatekeepers and start matching on LinkMate.")
                    pre_fill = parsed.get("pre_fill", f"Looking for {keyword}")
                    wtlf = parsed.get("what_to_look_for", default_what_to_look_for)
                    if not isinstance(wtlf, list) or len(wtlf) == 0:
                        wtlf = default_what_to_look_for

                    # Cache the new generated keyword in the database
                    c.execute("""
                        INSERT INTO seo_keywords (phrase, canonical_term, intent, industry_id, sub_industry_id, search_volume, difficulty, heading, description, pre_fill, what_to_look_for)
                        VALUES (%s, %s, %s, NULL, NULL, 50, 20, %s, %s, %s, %s)
                        ON CONFLICT (phrase) DO NOTHING
                    """, (clean_keyword, keyword.title(), "Dynamic AI Generated", heading, description, pre_fill, json.dumps(wtlf)))
                    conn.commit()
                    
                    return {
                        "phrase": clean_keyword,
                        "canonical_term": keyword.title(),
                        "intent": "Dynamic AI Generated",
                        "heading": heading,
                        "description": description,
                        "pre_fill": pre_fill,
                        "what_to_look_for": wtlf
                    }
            except Exception as e:
                print(f"Error generating dynamic copy with Llama3.1: {e}")

        # Final Fallback if anything failed
        return {
            "phrase": clean_keyword,
            "canonical_term": keyword.title(),
            "intent": "Fallback",
            "heading": f"Looking for a verified {keyword.title()}?",
            "description": f"Find trusted partners and service providers for {keyword} in our verified business partner introduction network. Skip the gatekeepers and start matching on LinkMate.",
            "pre_fill": f"Need {keyword}",
            "what_to_look_for": default_what_to_look_for
        }

    finally:
        c.close()
        conn.close()
