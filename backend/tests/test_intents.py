import sys
import os
from fastapi.testclient import TestClient

# Add parent dir to path so we can import app and main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.log import init_db

client = TestClient(app)

def test_intents_flow():
    # 1. Initialize DB to make sure new tables exist and are seeded
    init_db()
    
    # 2. Register/login a user
    register_payload = {
        "first_name": "IntentTest",
        "last_name": "User",
        "email": "test_intents@example.com",
        "phone": "+27111222333",
        "company_name": "Intent Corp",
        "password": "securepassword123"
    }
    
    # Create or clean old user
    reg_response = client.post("/signup", json=register_payload)
    
    # Activate user
    client.get(f"/activate?email={register_payload['email']}")
    
    login_payload = {
        "email": "test_intents@example.com",
        "password": "securepassword123"
    }
    login_response = client.post("/signin", json=login_payload)
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Fetch seeded industries
    ind_response = client.get("/users/industries")
    assert ind_response.status_code == 200
    industries = ind_response.json()
    assert len(industries) > 0
    print("Industries list seeded and fetched successfully!")

    # 4. Save free-text intent with multiple segments (Insurance / Finance + Software Dev / IT)
    # The text description represents a software developer working in the insurance space.
    free_text = "I am a software developer building custom API integrations and CRM platforms specifically for South African insurance brokers."
    
    update_payload = {
        "intent": free_text
    }
    update_response = client.put("/profile", json=update_payload, headers=headers)
    assert update_response.status_code == 200, update_response.text
    profile_data = update_response.json()
    
    # Check that original raw text is kept as 'intent'
    assert profile_data["intent"] == free_text
    
    # Verify that AI parsed multiple segments into user_intents
    assert "intents" in profile_data
    intents = profile_data["intents"]
    print("Extracted B2B segments from AI:", intents)
    
    assert len(intents) >= 2, f"Expected at least 2 segments extracted, got: {len(intents)}"
    
    # Check for Insurance/Financial Services
    has_insurance = any(
        "Insurance" in i["sub_industry_name"] or "Financial Services" in i["industry_name"]
        for i in intents
    )
    # Check for Software/Telecom/IT
    has_software = any(
        "Software" in i["sub_industry_name"] or "Telecommunications" in i["industry_name"] or "IT" in i["sub_industry_name"]
        for i in intents
    )
    
    assert has_insurance, f"Expected insurance/financial B2B segment to be extracted: {intents}"
    assert has_software, f"Expected software/IT B2B segment to be extracted: {intents}"
    
    print("Automatic AI extraction of multiple B2B segment intents works perfectly!")
    print("All B2B user intents AI segmentation integration tests passed successfully!")

if __name__ == "__main__":
    test_intents_flow()
