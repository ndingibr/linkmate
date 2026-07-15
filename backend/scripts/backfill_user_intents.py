import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.db import get_conn
from app.ai import parse_json_response
import openai
import psycopg2

openai.api_key = settings.openai_api_key
client = openai
MODEL = settings.openai_model

def extract_segments_and_profile(intent_text: str) -> dict:
    if not intent_text or not intent_text.strip():
        return {"segments": [], "profile": {}}
        
    prompt = f"""
Analyze the following B2B matchmaking intention text for a user:
"{intent_text}"

We need to extract two things:
1. A list of B2B segments (industry, sub_industry, type, intention).
   - industry: A high-level industry category (e.g. "Financial Services & Banking", "Telecommunications & IT", "Mining & Resources", "Agriculture & Agro-processing", "Manufacturing & Automotive", "Retail, Wholesale & Logistics", "Tourism & Hospitality", "Healthcare & Pharmaceuticals", "Energy & Utilities", "Construction & Infrastructure", "Business Services & Consulting").
   - sub_industry: Specific sub-category (e.g. "Software Development", "Insurance", "Lead Generation", "Solar & Renewable Energy").
   - type: "buy" (seeking/looking for) or "give" (offering/selling).
   - intention: Specific sub-text relating to this segment.

2. Inferred profile details (only if explicitly mentioned or highly likely based on the text):
   - role: The person's job title or role (e.g., "Software Developer", "Founder", "Broker")
   - location: A South African city/hub if mentioned (e.g., "Sandton", "Cape Town")
   - influence: Level of decision influence ("Recommend / Influence", "Decision Maker", "Owner / Partner")
   - has_budget: Boolean (true if budget details are mentioned, false otherwise)
   - budget_currency: Currency mentioned (e.g., "ZAR", "USD")
   - budget_min: Minimum budget amount (integer or null)
   - budget_max: Maximum budget amount (integer or null)

Return JSON ONLY in the following format:
{{
  "segments": [
    {{
      "industry": "...",
      "sub_industry": "...",
      "type": "...",
      "intention": "..."
    }}
  ],
  "profile": {{
    "role": "..." or null,
    "location": "..." or null,
    "influence": "..." or null,
    "has_budget": true/false,
    "budget_currency": "ZAR" or null,
    "budget_min": ... or null,
    "budget_max": ... or null
  }}
}}
"""
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            response_format={"type": "json_object"}
        )
        raw_content = response.choices[0].message.content
        result = parse_json_response(raw_content)
        return result
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return {"segments": [], "profile": {}}

def main():
    limit = 100
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
        except ValueError:
            pass
            
    print(f"Starting B2B intents and profiles backfill migration (Limit: {limit} users)...")
    
    # Connect and fetch unmigrated users only
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT DISTINCT u.id, u.first_name, u.last_name, u.intent, 
                        u.role, u.location, u.influence, u.has_budget, 
                        u.budget_min, u.budget_max, u.budget_currency 
        FROM users u
        LEFT JOIN user_intents ui ON u.id = ui.user_id
        WHERE u.intent IS NOT NULL AND u.intent != '' AND ui.id IS NULL
        LIMIT %s
    """, (limit,))
    users = [dict(row) for row in c.fetchall()]
    conn.close()
    
    print(f"Found {len(users)} users that need B2B segment backfilling in this batch.")
    
    backfilled_count = 0
    
    for u in users:
        user_id = u["id"]
        name = f"{u['first_name']} {u['last_name']}"
        intent_text = u["intent"]
        
        print(f"[+] Processing User {name} ({user_id})...")
        
        # Run AI extraction
        data = extract_segments_and_profile(intent_text)
        segments = data.get("segments", [])
        profile = data.get("profile", {})
        
        print(f"    -> Extracted {len(segments)} segments and profile fields: {profile}")
        
        # Save results in a fresh connection per user to avoid transaction/timeout issues
        conn = None
        try:
            conn = get_conn()
            c = conn.cursor()
            
            for s in segments:
                ind_name = (s.get("industry") or "").strip()
                sub_name = (s.get("sub_industry") or "").strip()
                itype = (s.get("type") or "buy").strip().lower()
                intention = (s.get("intention") or "").strip()
                
                if not ind_name or not sub_name or not intention:
                    continue
                if itype not in ["buy", "give"]:
                    itype = "buy"
                    
                # Resolve Industry
                c.execute("SELECT id FROM industries WHERE LOWER(name) = LOWER(%s)", (ind_name,))
                row = c.fetchone()
                if row:
                    industry_id = row["id"]
                else:
                    c.execute("INSERT INTO industries (name) VALUES (%s) RETURNING id", (ind_name,))
                    industry_id = c.fetchone()["id"]
                    
                # Resolve Sub-Industry
                c.execute("SELECT id FROM sub_industries WHERE LOWER(name) = LOWER(%s)", (sub_name,))
                row = c.fetchone()
                if row:
                    sub_industry_id = row["id"]
                else:
                    c.execute("INSERT INTO sub_industries (name) VALUES (%s) RETURNING id", (sub_name,))
                    sub_industry_id = c.fetchone()["id"]
                    
                # Ensure linkage
                c.execute("""
                    INSERT INTO industry_sub_industries (industry_id, sub_industry_id)
                    VALUES (%s, %s) ON CONFLICT DO NOTHING
                """, (industry_id, sub_industry_id))
                
                # Insert intent
                c.execute("""
                    INSERT INTO user_intents (user_id, industry_id, sub_industry_id, type, intention)
                    VALUES (%s, %s, %s, %s, %s)
                """, (user_id, industry_id, sub_industry_id, itype, intention))
                
            # Backfill profile fields ONLY if they are currently null/empty
            updates = {}
            for field in ["role", "location", "influence", "budget_currency"]:
                val = profile.get(field)
                if val and (not u[field] or not str(u[field]).strip()):
                    updates[field] = val
                    
            if profile.get("has_budget") is not None and u["has_budget"] is None:
                updates["has_budget"] = profile["has_budget"]
                
            for field in ["budget_min", "budget_max"]:
                val = profile.get(field)
                if val is not None and u[field] is None:
                    try:
                        updates[field] = int(val)
                    except (ValueError, TypeError):
                        pass
                        
            if updates:
                set_clauses = []
                values = []
                for k, v in updates.items():
                    set_clauses.append(f"{k} = %s")
                    values.append(v)
                values.append(user_id)
                query = f"UPDATE users SET {', '.join(set_clauses)} WHERE id = %s"
                c.execute(query, tuple(values))
                print(f"    -> Updated profile fields: {list(updates.keys())}")
                
            conn.commit()
            backfilled_count += 1
            print(f"    [SUCCESS] Successfully backfilled User {name}.")
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"    [ERROR] Error backfilling User {name}: {e}")
        finally:
            if conn:
                conn.close()
            
    print(f"\nMigration finished. Successfully backfilled {backfilled_count} users in this batch.")

if __name__ == "__main__":
    main()
