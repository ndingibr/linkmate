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

OLLAMA_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1")

# Configure Ollama local client
client = openai.OpenAI(
    base_url=OLLAMA_URL,
    api_key="ollama" # Ollama doesn't require a key, but OpenAI SDK expects a non-empty string
)
MODEL = "llama3.1"
EMBEDDING_MODEL = "nomic-embed-text" # 768 dimensions, blazingly fast local embedding model

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

def ensure_ollama_models():
    """
    Query the local/production Ollama instance list.
    If llama3.1 or nomic-embed-text are missing, automatically pull them.
    """
    base_ollama_url = OLLAMA_URL.replace("/v1", "")
    required_models = [MODEL, EMBEDDING_MODEL]
    for model in required_models:
        try:
            # 1. Check if model is already pulled
            req = urllib.request.Request(f"{base_ollama_url}/api/tags")
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                installed_models = [m["name"].split(":")[0] for m in data.get("models", [])]
                installed_names = [m["name"] for m in data.get("models", [])]
                if model in installed_models or model in installed_names:
                    logger.info(f"Ollama model '{model}' is already available.")
                    continue
            
            # 2. If not pulled, trigger pull
            logger.info(f"Ollama model '{model}' is missing. Pulling automatically...")
            pull_url = f"{base_ollama_url}/api/pull"
            payload = json.dumps({"name": model, "stream": False}).encode("utf-8")
            pull_req = urllib.request.Request(
                pull_url, 
                data=payload,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(pull_req, timeout=600) as response:
                logger.info(f"Successfully pulled Ollama model '{model}'.")
        except urllib.error.URLError as e:
            logger.warning(f"Could not connect to Ollama instance to verify/pull '{model}' at {base_ollama_url}: {e}")
        except Exception as e:
            logger.error(f"Error checking/pulling Ollama model '{model}': {e}")

def generate_embedding(text: str) -> list:
    """
    Generates a 768-dimensional vector embedding for the input text using local Ollama model (nomic-embed-text).
    """
    if not text or not text.strip():
        return []
    try:
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=[text.strip()]
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Error generating local Ollama embedding: {e}. Make sure Ollama is running and '{EMBEDDING_MODEL}' is pulled.")
        return []

def evaluate_intent_match(user_a: dict, user_b: dict, intent_a_text: str, intent_b_text: str, industry: str, sub_industry: str) -> dict:
    """
    Use local Llama 3.1 via Ollama to evaluate B2B intent complementarity in a segment.
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
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            response_format={"type": "json_object"}
        )
        data = json.loads(response.choices[0].message.content)
        return {
            "is_match": bool(data.get("is_match", False)),
            "score": float(data.get("score", 0)),
            "reason": str(data.get("reason", "No synergy context available."))
        }
    except Exception as e:
        logger.error(f"Failed local Ollama Llama 3.1 check for {user_a['id']} and {user_b['id']}: {e}. Make sure '{MODEL}' is pulled in Ollama.")
        return {"is_match": False, "score": 0.0, "reason": ""}

def run_matching_cycle():
    """
    Core matching loop running every 30 mins:
    1. Verify Ollama models are pulled (pull them automatically if missing).
    2. Ensure all active user intents have local embeddings.
    3. Evaluate candidates within matching sub-industries having opposite (buy vs give) intents.
    """
    logger.info("Starting local B2B matches evaluation cycle using Ollama (Llama 3.1 & nomic-embed-text)...")
    
    # 0. Automatically check/pull missing Ollama models
    ensure_ollama_models()
    
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
        logger.info(f"Generating local embeddings for {len(unembedded_intents)} user intents using {EMBEDDING_MODEL}...")
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
        LIMIT 100
    """)
    candidates = [dict(row) for row in c.fetchall()]
    conn.close()
    
    if not candidates:
        logger.info("No matching sub-industry buy/give intent candidates found.")
        return
        
    logger.info(f"Evaluating {len(candidates)} potential B2B segment match pairs using Llama 3.1.")
    
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


def run_matching_for_user(user_id: int):
    """
    Runs matching immediately for a specific user after they update their profile.
    """
    logger.info(f"Running immediate matching cycle for user {user_id}...")
    
    # 0. Automatically check/pull missing Ollama models
    ensure_ollama_models()
    
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
        LIMIT 10
    """, (user_id, user_id, user_id, user_id))
    candidates = [dict(row) for row in c.fetchall()]
    conn.close()
    
    if not candidates:
        logger.info(f"No immediate candidates found for user {user_id}.")
        return
        
    logger.info(f"Evaluating {len(candidates)} potential immediate B2B match pairs for user {user_id} using Llama 3.1.")
    
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
