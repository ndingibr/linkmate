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
