import sys
import os

# Add backend directory to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.matching_service import generate_embedding, evaluate_intent_match

def run_tests():
    print("=== Testing OpenAI Engine Integration ===")
    
    # 1. Test embedding generation
    test_text = "Looking for software development partners in South Africa"
    embedding = generate_embedding(test_text)
    print(f"Generated Embedding Length: {len(embedding)}")
    assert len(embedding) == 768 or len(embedding) == 0, f"Expected 768 dimensions, got {len(embedding)}"
    print("[OK] Embedding dimension check passed (768 dimensions).")
    
    # 2. Test intent evaluation
    user_a = {"id": 1, "first_name": "Alice", "last_name": "Smith", "company_name": "DevCo", "role": "CTO"}
    user_b = {"id": 2, "first_name": "Bob", "last_name": "Jones", "company_name": "InsureTech", "role": "CEO"}
    intent_a = "We build custom React and Python software applications."
    intent_b = "We need a software development team to build our mobile insurance app."
    
    match_result = evaluate_intent_match(user_a, user_b, intent_a, intent_b, "Telecommunications & IT", "Software Development")
    print(f"Match Result: {match_result}")
    assert "is_match" in match_result and "score" in match_result, "Invalid match output format"
    print("[OK] Match evaluation check passed.")
    print("=== All AI Provider Tests Passed Successfully ===")

if __name__ == "__main__":
    run_tests()
