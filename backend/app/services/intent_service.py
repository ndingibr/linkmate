# intent_service.py
import openai
import json
from app.core.config import settings
from app.ai import parse_json_response

openai.api_key = settings.openai_api_key
client = openai
MODEL = settings.openai_model

def evaluate_b2b_intent(intent_query: str) -> dict:
    if not intent_query or not intent_query.strip():
        return {
            "score": 0,
            "clarity_level": "Weak",
            "suggestions": ["Please enter your business intention to scan South African networks."],
            "strength_metrics": {
                "ethical": 0,
                "professional": 0,
                "mutual_benefit": 0,
                "reasonableness": 0,
                "alignment": 0,
                "completeness": 0
            }
        }

    prompt = f"""
Evaluate the quality and strength of the following B2B matchmaking intention:
"{intent_query}"

Analyze it against the following B2B relationship criteria, scoring each from 0 to 100:
1. Ethical: Is the business intention ethical, legal, and compliant?
2. Professional: Is the tone, vocabulary, and intent professional and business-focused?
3. Mutually Beneficial: Does it outline a clear value proposition for both parties, rather than being one-sided?
4. Reasonable: Are the expectations, deliverables, and timeline realistic and achievable?
5. Alignment: Is it aligned with B2B relationship building (role-based, target partners)?
6. Completeness: Does it specify key details like target industry, region, and budget/scale if applicable?

Return JSON ONLY with:
- score: an overall weighted integer score from 0 to 100 representing the actionability and strength of the intent
- clarity_level: string: "Weak", "Moderate", or "Strong"
- suggestions: a list of 1-3 specific, actionable recommendations to improve the intent statement
- strength_metrics: a dictionary with key-value pairs (integers 0 to 100) for:
  - "ethical"
  - "professional"
  - "mutual_benefit"
  - "reasonableness"
  - "alignment"
  - "completeness"
"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )
        raw_content = response.choices[0].message.content
        result = parse_json_response(raw_content)
        
        # Validate keys
        if "score" not in result or "clarity_level" not in result or "suggestions" not in result:
            raise ValueError("Malformed AI response")
            
        # Ensure correct types
        result["score"] = int(result.get("score", 50))
        result["suggestions"] = list(result.get("suggestions", []))
        
        # Enforce boundary checks
        if result["score"] < 0:
            result["score"] = 0
        elif result["score"] > 100:
            result["score"] = 100

        # Validate strength metrics
        metrics = result.get("strength_metrics", {})
        for key in ["ethical", "professional", "mutual_benefit", "reasonableness", "alignment", "completeness"]:
            if key not in metrics:
                metrics[key] = 50
            else:
                metrics[key] = max(0, min(100, int(metrics[key])))
        result["strength_metrics"] = metrics
            
        return result
    except Exception as e:
        print(f"Error calling OpenAI in evaluate_b2b_intent: {e}")
        # Return fallback evaluation
        length = len(intent_query.strip())
        ethical_score = 90 if "hack" not in intent_query.lower() and "scam" not in intent_query.lower() else 20
        professional_score = 80 if len(intent_query.split()) > 5 else 40
        mutual_score = 75 if "help" in intent_query.lower() or "partner" in intent_query.lower() or "develop" in intent_query.lower() else 45
        reasonableness_score = 85 if length > 30 else 50
        alignment_score = 70 if "software" in intent_query.lower() or "app" in intent_query.lower() or "dev" in intent_query.lower() else 50
        completeness_score = min(100, int(length * 1.2))

        metrics = {
            "ethical": ethical_score,
            "professional": professional_score,
            "mutual_benefit": mutual_score,
            "reasonableness": reasonableness_score,
            "alignment": alignment_score,
            "completeness": completeness_score
        }

        if length < 20:
            return {
                "score": 30,
                "clarity_level": "Weak",
                "suggestions": ["Provide more detail about what product/service you seek or offer.", "Add target location or partner requirements."],
                "strength_metrics": metrics
            }
        elif length < 60:
            return {
                "score": 60,
                "clarity_level": "Moderate",
                "suggestions": ["Add target locality or city hubs.", "Mention any specific budget, timing, or industry scale."],
                "strength_metrics": metrics
            }
        else:
            return {
                "score": 85,
                "clarity_level": "Strong",
                "suggestions": ["Ensure target budget and decision influence are up-to-date in your settings."],
                "strength_metrics": metrics
            }


def extract_intent_segments(intent_text: str) -> list:
    if not intent_text or not intent_text.strip():
        return []
        
    prompt = f"""
Analyze the following B2B matchmaking intention text:
"{intent_text}"

Identify and extract all relevant business segments (Industry, Sub-industry, and Type) the user is targeting or offering.
A single description can map to multiple industries/sub-industries (for example, if someone is looking for software dev in insurance, they belong to "Telecommunications & IT" -> "Software Development" and "Financial Services & Banking" -> "Insurance").

Standard high-level industries in South Africa:
- Financial Services & Banking
- Mining & Resources
- Agriculture & Agro-processing
- Manufacturing & Automotive
- Retail, Wholesale & Logistics
- Telecommunications & IT
- Tourism & Hospitality
- Healthcare & Pharmaceuticals
- Energy & Utilities
- Construction & Infrastructure
- Business Services & Consulting

For each identified segment, extract:
1. industry: The high-level industry category (prefer matching the standard ones listed above, or generate a suitable one if none fit).
2. sub_industry: The specific sub-category (e.g. "Software Development", "Insurance", "Lead Generation", "Solar & Renewable Energy", etc.).
3. type: Either "buy" (if they are seeking, looking for, needing, buying) or "give" (if they are offering, selling, providing, developing).
4. intention: The specific text portion of the description that relates to this segment.

Return JSON ONLY as a list of objects under a "segments" key. Each object should have keys:
- "industry" (string)
- "sub_industry" (string)
- "type" (string: "buy" or "give")
- "intention" (string)
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
        
        # The result might be a dictionary with a list key, e.g., {"segments": [...]} or directly a list.
        if isinstance(result, dict) and "segments" in result:
            segments = result["segments"]
        elif isinstance(result, dict) and isinstance(result.get("data"), list):
            segments = result["data"]
        elif isinstance(result, list):
            segments = result
        elif isinstance(result, dict):
            list_keys = [k for k, v in result.items() if isinstance(v, list)]
            if list_keys:
                segments = result[list_keys[0]]
            else:
                segments = [result]
        else:
            segments = []
            
        # Standardize and validate keys
        standardized = []
        for s in segments:
            if not isinstance(s, dict):
                continue
            ind = s.get("industry", "").strip()
            sub = s.get("sub_industry", "").strip()
            itype = s.get("type", "buy").strip().lower()
            intent = s.get("intention", "").strip()
            
            if not ind or not sub or not intent:
                continue
            if itype not in ["buy", "give"]:
                itype = "buy"
                
            standardized.append({
                "industry": ind,
                "sub_industry": sub,
                "type": itype,
                "intention": intent
            })
        return standardized
    except Exception as e:
        print(f"Error extracting intent segments: {e}")
        # Return a simple fallback segment if OpenAI call fails
        return []
