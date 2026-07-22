# matching_service.py
import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, List
from app.core.db import get_conn
from app.core.config import settings
import openai

logger = logging.getLogger(__name__)

import os

OPENAI_KEY = getattr(settings, "openai_api_key", os.environ.get("OPENAI_API_KEY", ""))

openai_client = openai.OpenAI(
    api_key=OPENAI_KEY
) if OPENAI_KEY else None

def get_user_performance_score(user_id: int) -> float:
    """
    Calculate the User Performance Score (UPS) dynamically based on match history.
    Formula: UPS = 0.5 + 0.5 * (conversions / total) - 0.1 * (stale pending matches)
    Default to 1.0 if the user has no history. Bounded between 0.2 and 1.5.
    """
    conn = get_conn()
    c = conn.cursor()
    
    # 1. Total matches
    c.execute("""
        SELECT COUNT(*) as total 
        FROM matches 
        WHERE user_id_1 = %s OR user_id_2 = %s
    """, (user_id, user_id))
    total = c.fetchone()["total"]
    
    if total == 0:
        conn.close()
        return 1.0
        
    # 2. Converted / Connected matches
    c.execute("""
        SELECT COUNT(*) as converted 
        FROM matches 
        WHERE (user_id_1 = %s OR user_id_2 = %s) 
          AND (status = 'connected' OR status = 'converted')
    """, (user_id, user_id))
    converted = c.fetchone()["converted"]
    
    # 3. Stale pending matches (> 48 hours in pending state)
    c.execute("""
        SELECT COUNT(*) as stale 
        FROM matches 
        WHERE (user_id_1 = %s OR user_id_2 = %s) 
          AND status = 'pending' 
          AND created_at < NOW() - INTERVAL '48 hours'
    """, (user_id, user_id))
    stale = c.fetchone()["stale"]
    
    conn.close()
    
    ups = 0.5 + 0.5 * (converted / total) - 0.1 * stale
    return max(0.2, min(1.5, ups))

def generate_embedding(text: str) -> list:
    """
    Generates a 768-dimensional vector embedding for the input text using OpenAI (text-embedding-3-small, dimensions=768).
    """
    if not text or not text.strip():
        return []

    if openai_client:
        try:
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=[text.strip()],
                dimensions=768
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating OpenAI embedding: {e}")
            return []

    logger.error("OPENAI_API_KEY missing, cannot generate vector embedding.")
    return []

def evaluate_intent_match(user_a: dict, user_b: dict, intent_a_text: str, intent_b_text: str, industry: str, sub_industry: str) -> dict:
    """
    Use OpenAI gpt-4o-mini to evaluate B2B intent complementarity in a segment.
    Returns: is_match (bool), score (0-100), reason (str)
    """
    prompt = f"""
Assess the B2B compatibility and business synergy between these two companies in the context of the {industry} / {sub_industry} industry segment:

User A:
- First Name: {user_a.get('first_name', 'N/A')}
- Last Name: {user_a.get('last_name', 'N/A')}
- Company: {user_a.get('company_name', 'N/A')}
- Role: {user_a.get('role', 'N/A')}
- Intention/Offer: "{intent_a_text}"

User B:
- First Name: {user_b.get('first_name', 'N/A')}
- Last Name: {user_b.get('last_name', 'N/A')}
- Company: {user_b.get('company_name', 'N/A')}
- Role: {user_b.get('role', 'N/A')}
- Intention/Need: "{intent_b_text}"

Determine if they can help each other (e.g. User A offers what User B needs, or they are complementary partners).
Provide a raw matching score (0 to 100) representing their compatibility percentage.

Return JSON ONLY with keys:
- "is_match": (boolean)
- "score": (number, 0 to 100)
- "reason": (string explaining the business synergy in 2-3 sentences)
"""
    if openai_client:
        try:
            from app.ai import parse_json_response
            response = openai_client.chat.completions.create(
                model=settings.openai_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                response_format={"type": "json_object"}
            )
            data = parse_json_response(response.choices[0].message.content)
            return {
                "is_match": bool(data.get("is_match", False)),
                "score": float(data.get("score", 0)),
                "reason": str(data.get("reason", "No synergy context available."))
            }
        except Exception as e:
            logger.error(f"Failed OpenAI match evaluation for users {user_a.get('id')} and {user_b.get('id')}: {e}")

    return {"is_match": False, "score": 0.0, "reason": ""}

def run_matching_cycle():
    """
    Core matching loop running every 30 mins:
    1. Ensure all active user intents have embeddings.
    2. Evaluate candidates within matching sub-industries having opposite (buy vs give) intents.
    """
    logger.info("Starting B2B matches evaluation cycle using OpenAI...")
    
    conn = get_conn()
    c = conn.cursor()
    
    # 1. Ensure all active user intents have an embedding
    c.execute("""
        SELECT ui.id, ui.intention 
        FROM user_intents ui
        JOIN users u ON ui.user_id = u.id
        WHERE u.intent_active = TRUE AND ui.intention IS NOT NULL AND ui.intention != '' AND ui.intent_vector IS NULL
    """)
    unembedded_intents = [dict(row) for row in c.fetchall()]
    
    if unembedded_intents:
        logger.info(f"Generating OpenAI 768-dim embeddings for {len(unembedded_intents)} user intents...")
        for ui in unembedded_intents:
            emb = generate_embedding(ui["intention"])
            if emb:
                c.execute("UPDATE user_intents SET intent_vector = %s WHERE id = %s", (emb, ui["id"]))
        conn.commit()
        
    # 2. Get existing match pairs to avoid duplicate evaluation
    c.execute("SELECT user_id_1, user_id_2 FROM matches")
    existing_pairs = {(row["user_id_1"], row["user_id_2"]) for row in c.fetchall()}
    
    # 3. Fetch candidate matching pairs where sub_industry matches and type is opposite (buy vs give)
    # Ordered by pgvector cosine distance (closest matches first)
    c.execute("""
        SELECT
            ui1.user_id as u1_id,
            ui2.user_id as u2_id,
            ui1.intention as u1_intention,
            ui2.intention as u2_intention,
            ui1.type as u1_type,
            ui2.type as u2_type,
            i.name as industry_name,
            s.name as sub_industry_name,
            (ui1.intent_vector <=> ui2.intent_vector) as distance
        FROM user_intents ui1
        JOIN user_intents ui2 ON ui1.sub_industry_id = ui2.sub_industry_id
        JOIN industries i ON ui1.industry_id = i.id
        JOIN sub_industries s ON ui1.sub_industry_id = s.id
        JOIN users u1 ON ui1.user_id = u1.id
        JOIN users u2 ON ui2.user_id = u2.id
        WHERE ui1.user_id < ui2.user_id
          AND (
            (ui1.type = 'buy' AND ui2.type = 'give') OR
            (ui1.type = 'give' AND ui2.type = 'buy')
          )
          AND u1.intent_active = TRUE AND u2.intent_active = TRUE
          AND ui1.intent_vector IS NOT NULL AND ui2.intent_vector IS NOT NULL
        ORDER BY distance ASC
    """)
    candidates = [dict(row) for row in c.fetchall()]
    conn.close()
    
    if not candidates:
        logger.info("No matching sub-industry buy/give intent candidates found.")
        return
        
    logger.info(f"Evaluating {len(candidates)} potential B2B segment match pairs using OpenAI.")
    
    matches_added = 0
    evaluated_pairs = set()
    
    for cand in candidates:
        u1_id = cand["u1_id"]
        u2_id = cand["u2_id"]
        pair = (u1_id, u2_id)
        
        if pair in existing_pairs or pair in evaluated_pairs:
            continue
            
        evaluated_pairs.add(pair)
        
        # Load user profiles
        conn = get_conn()
        c = conn.cursor()
        c.execute("SELECT id, first_name, last_name, company_name, role, intent FROM users WHERE id = %s", (u1_id,))
        user_a = c.fetchone()
        c.execute("SELECT id, first_name, last_name, company_name, role, intent FROM users WHERE id = %s", (u2_id,))
        user_b = c.fetchone()
        conn.close()
        
        if not user_a or not user_b:
            continue
            
        # Determine intent descriptions based on who is A and B
        intent_a_text = cand["u1_intention"]
        intent_b_text = cand["u2_intention"]
        
        # Run local Llama 3.1 check ONLY for this high-potential segment match pair
        eval_res = evaluate_intent_match(
            dict(user_a), dict(user_b), 
            intent_a_text, intent_b_text, 
            cand["industry_name"], cand["sub_industry_name"]
        )
        
        if eval_res["is_match"] and eval_res["score"] > 0:
            ups_a = get_user_performance_score(u1_id)
            ups_b = get_user_performance_score(u2_id)
            
            adjusted_score = eval_res["score"] * ups_a * ups_b
            final_score = min(100.0, round(adjusted_score, 1))
            
            if final_score >= 50.0:
                conn = get_conn()
                c = conn.cursor()
                try:
                    c.execute("""
                        INSERT INTO matches (user_id_1, user_id_2, score, status, match_reason)
                        VALUES (%s, %s, %s, 'pending', %s)
                        ON CONFLICT (user_id_1, user_id_2) DO NOTHING
                    """, (u1_id, u2_id, final_score, eval_res["reason"]))
                    conn.commit()
                    matches_added += 1
                    logger.info(f"Ollama Segment Match recorded: User {u1_id} <-> User {u2_id} at {final_score}% Match in {cand['sub_industry_name']}.")
                except Exception as ex:
                    logger.error(f"Error inserting match: {ex}")
                finally:
                    conn.close()
                    
    logger.info(f"Ollama B2B segment matching complete. Added {matches_added} new match records.")
    
    try:
        perform_audit_and_notify()
    except Exception as audit_err:
        logger.error(f"Error executing matchmaking audit cycle: {audit_err}")

def perform_audit_and_notify():
    """
    Compares the current database status of matches against the latest snapshot log
    to detect state transitions (new, rejected, connected) and sends a summary report.
    """
    from app.services.email import send_match_summary_email
    
    conn = get_conn()
    c = conn.cursor()
    
    # 1. Fetch current matches audit data using the full rich history query
    c.execute("""
        SELECT 
            m.id AS match_id,
            m.created_at AS match_time,
            
            -- Match Percentages (Raw score & Formatted representation)
            m.score AS match_percentage_numeric,
            CONCAT(ROUND(m.score, 0), '%') AS match_percentage_formatted,
            
            m.status AS match_status,
            m.match_reason AS ai_synergy_reason,
            
            -- Segment details
            ind.name AS industry,
            sub.name AS sub_industry,
            
            -- User 1 details & intention statement
            u1.id AS user_1_id,
            CONCAT(u1.first_name, ' ', u1.last_name) AS user_1_name,
            u1.company_name AS user_1_company,
            ui1.type AS user_1_intent_type,
            ui1.intention AS user_1_intention,
            
            -- User 2 details & intention statement
            u2.id AS user_2_id,
            CONCAT(u2.first_name, ' ', u2.last_name) AS user_2_name,
            u2.company_name AS user_2_company,
            ui2.type AS user_2_intent_type,
            ui2.intention AS user_2_intention

        FROM matches m
        JOIN users u1 ON m.user_id_1 = u1.id
        JOIN user_intents ui1 ON u1.id = ui1.user_id
        JOIN users u2 ON m.user_id_2 = u2.id
        JOIN user_intents ui2 ON u2.id = ui2.user_id
        JOIN sub_industries sub ON ui1.sub_industry_id = sub.id AND ui2.sub_industry_id = sub.id
        JOIN industries ind ON ui1.industry_id = ind.id
        WHERE 
            (ui1.type = 'buy' AND ui2.type = 'give') 
            OR (ui1.type = 'give' AND ui2.type = 'buy')
        ORDER BY m.created_at DESC;
    """)
    current_matches = [dict(row) for row in c.fetchall()]
    
    # Map current matches by ID
    current_map = {m["match_id"]: m for m in current_matches}
    
    # 2. Fetch the latest history status for each match
    c.execute("""
        SELECT DISTINCT ON (match_id) match_id, match_status
        FROM matches_history 
        ORDER BY match_id, model_run_update_time DESC;
    """)
    history_records = [dict(row) for row in c.fetchall()]
    history_map = {r["match_id"]: r["match_status"] for r in history_records}
    
    new_matches = []
    rejected_matches = []
    connected_matches = []
    
    # 3. Detect changes
    for match_id, curr in current_map.items():
        curr_status = curr["match_status"]
        prev_status = history_map.get(match_id)
        
        # New Match detection
        if prev_status is None:
            new_matches.append(curr)
        # Status change to rejected detection
        elif curr_status == 'rejected' and prev_status != 'rejected':
            rejected_matches.append({
                "match_id": match_id,
                "match_percentage": round(curr["match_percentage_numeric"]),
                "user_1_name": curr["user_1_name"],
                "user_1_company": curr["user_1_company"],
                "user_2_name": curr["user_2_name"],
                "user_2_company": curr["user_2_company"]
            })
        # Status change to connected/converted detection
        elif curr_status in ['connected', 'converted'] and prev_status not in ['connected', 'converted']:
            connected_matches.append({
                "match_id": match_id,
                "match_percentage": round(curr["match_percentage_numeric"]),
                "user_1_name": curr["user_1_name"],
                "user_1_company": curr["user_1_company"],
                "user_2_name": curr["user_2_name"],
                "user_2_company": curr["user_2_company"]
            })
            
    # 4. Send email (even if 0 changes, to notify that the scheduler ran successfully)
    send_match_summary_email("ndingibr@gmail.com", new_matches, rejected_matches, connected_matches)
    
    # 5. Insert new rich history records for all matches
    for match_id, curr in current_map.items():
        c.execute("""
            INSERT INTO matches_history (
                match_id, match_time, match_percentage_numeric, match_percentage_formatted,
                match_status, ai_synergy_reason, industry, sub_industry,
                user_1_id, user_1_name, user_1_company, user_1_intent_type, user_1_intention,
                user_2_id, user_2_name, user_2_company, user_2_intent_type, user_2_intention,
                model_run_update_time
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                NOW()
            )
        """, (
            curr["match_id"], curr["match_time"], curr["match_percentage_numeric"], curr["match_percentage_formatted"],
            curr["match_status"], curr["ai_synergy_reason"], curr["industry"], curr["sub_industry"],
            curr["user_1_id"], curr["user_1_name"], curr["user_1_company"], curr["user_1_intent_type"], curr["user_1_intention"],
            curr["user_2_id"], curr["user_2_name"], curr["user_2_company"], curr["user_2_intent_type"], curr["user_2_intention"]
        ))
    conn.commit()
    conn.close()
    logger.info("Matchmaking status history logged and audit notification completed.")

def run_matching_for_user(user_id: int):
    """
    Runs matching immediately for a specific user after they update their profile.
    """
    logger.info(f"Running immediate matching cycle for user {user_id}...")
    
    conn = get_conn()
    c = conn.cursor()
    
    # 1. Ensure the user's intents have embeddings
    c.execute("""
        SELECT ui.id, ui.intention 
        FROM user_intents ui
        WHERE ui.user_id = %s AND ui.intention IS NOT NULL AND ui.intention != '' AND ui.intent_vector IS NULL
    """, (user_id,))
    unembedded = [dict(row) for row in c.fetchall()]
    for ui in unembedded:
        emb = generate_embedding(ui["intention"])
        if emb:
            c.execute("UPDATE user_intents SET intent_vector = %s WHERE id = %s", (emb, ui["id"]))
    conn.commit()
    
    # 2. Get existing matches to avoid duplicate evaluation
    c.execute("SELECT user_id_1, user_id_2 FROM matches WHERE user_id_1 = %s OR user_id_2 = %s", (user_id, user_id))
    existing_pairs = {(row["user_id_1"], row["user_id_2"]) for row in c.fetchall()}
    
    # 3. Fetch candidate matching pairs where user_id matches one of the sides, sub_industry matches, and type is opposite
    c.execute("""
        SELECT
            ui1.user_id as u1_id,
            ui2.user_id as u2_id,
            ui1.intention as u1_intention,
            ui2.intention as u2_intention,
            ui1.type as u1_type,
            ui2.type as u2_type,
            i.name as industry_name,
            s.name as sub_industry_name,
            (ui1.intent_vector <=> ui2.intent_vector) as distance
        FROM user_intents ui1
        JOIN user_intents ui2 ON ui1.sub_industry_id = ui2.sub_industry_id
        JOIN industries i ON ui1.industry_id = i.id
        JOIN sub_industries s ON ui1.sub_industry_id = s.id
        JOIN users u1 ON ui1.user_id = u1.id
        JOIN users u2 ON ui2.user_id = u2.id
        WHERE (ui1.user_id = %s OR ui2.user_id = %s)
          AND ui1.user_id != ui2.user_id
          AND (
            (ui1.type = 'buy' AND ui2.type = 'give') OR
            (ui1.type = 'give' AND ui2.type = 'buy')
          )
          AND u1.intent_active = TRUE AND u2.intent_active = TRUE
          AND ui1.intent_vector IS NOT NULL AND ui2.intent_vector IS NOT NULL
        ORDER BY distance ASC
    """, (user_id, user_id, user_id, user_id))
    candidates = [dict(row) for row in c.fetchall()]
    conn.close()
    
    if not candidates:
        logger.info(f"No immediate candidates found for user {user_id}.")
        return
        
    logger.info(f"Evaluating {len(candidates)} potential immediate B2B match pairs for user {user_id} using OpenAI.")
    
    matches_added = 0
    evaluated_pairs = set()
    
    for cand in candidates:
        u1_id = cand["u1_id"]
        u2_id = cand["u2_id"]
        pair = (min(u1_id, u2_id), max(u1_id, u2_id))
        
        if pair in existing_pairs or pair in evaluated_pairs:
            continue
            
        evaluated_pairs.add(pair)
        
        conn = get_conn()
        c = conn.cursor()
        c.execute("SELECT id, first_name, last_name, company_name, role, intent FROM users WHERE id = %s", (u1_id,))
        user_a = c.fetchone()
        c.execute("SELECT id, first_name, last_name, company_name, role, intent FROM users WHERE id = %s", (u2_id,))
        user_b = c.fetchone()
        conn.close()
        
        if not user_a or not user_b:
            continue
            
        intent_a_text = cand["u1_intention"]
        intent_b_text = cand["u2_intention"]
        
        eval_res = evaluate_intent_match(
            dict(user_a), dict(user_b), 
            intent_a_text, intent_b_text, 
            cand["industry_name"], cand["sub_industry_name"]
        )
        
        if eval_res["is_match"] and eval_res["score"] > 0:
            ups_a = get_user_performance_score(u1_id)
            ups_b = get_user_performance_score(u2_id)
            
            adjusted_score = eval_res["score"] * ups_a * ups_b
            final_score = min(100.0, round(adjusted_score, 1))
            
            if final_score >= 50.0:
                conn = get_conn()
                c = conn.cursor()
                try:
                    c.execute("""
                        INSERT INTO matches (user_id_1, user_id_2, score, status, match_reason)
                        VALUES (%s, %s, %s, 'pending', %s)
                        ON CONFLICT (user_id_1, user_id_2) DO NOTHING
                    """, (pair[0], pair[1], final_score, eval_res["reason"]))
                    conn.commit()
                    matches_added += 1
                    logger.info(f"Ollama Segment Match recorded for user {user_id}: User {pair[0]} <-> User {pair[1]} at {final_score}% Match.")
                except Exception as ex:
                    logger.error(f"Error inserting immediate match: {ex}")
                finally:
                    conn.close()
