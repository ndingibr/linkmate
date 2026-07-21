import sys
import os
from fastapi.testclient import TestClient

# Add parent dir to path so we can import app and main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.log import init_db

client = TestClient(app)

def test_user_flow():
    # 1. Initialize DB to make sure users table exists
    init_db()
    
    # 2. Register a new user
    register_payload = {
        "first_name": "Test",
        "last_name": "User",
        "email": "test_user_profile@example.com",
        "phone": "+27123456789",
        "company_name": "Acme Inc.",
        "password": "securepassword123"
    }
    
    # Check if user already exists from previous runs, if so ignore 400
    reg_response = client.post("/signup", json=register_payload)
    print("Register Response Status:", reg_response.status_code)
    if reg_response.status_code == 201:
        reg_data = reg_response.json()
        assert reg_data["email"] == "test_user_profile@example.com"
        assert reg_data["first_name"] == "Test"
        assert reg_data["company_name"] == "Acme Inc."
        print("Registration successful!")
    elif reg_response.status_code == 400:
        print("User already registered, resetting profile details for test.")
        # Reset profile details to make tests repeatable across runs
        from app.core.db import get_conn
        conn = get_conn()
        c = conn.cursor()
        c.execute(
            "UPDATE users SET first_name = 'Test', company_name = 'Acme Inc.' WHERE email = %s",
            ("test_user_profile@example.com",)
        )
        conn.commit()
        conn.close()
    else:
        raise AssertionError(f"Unexpected registration response: {reg_response.text}")
        
    # Unconditionally activate user to clear any stale state
    client.get(f"/activate?email={register_payload['email']}")

    # 3. Login
    login_payload = {
        "email": "test_user_profile@example.com",
        "password": "securepassword123"
    }
    login_response = client.post("/signin", json=login_payload)
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    token_data = login_response.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    print("Login successful!")
    
    # 4. Get Profile
    headers = {"Authorization": f"Bearer {token}"}
    profile_response = client.get("/profile", headers=headers)
    assert profile_response.status_code == 200, f"Profile fetch failed: {profile_response.text}"
    profile_data = profile_response.json()
    assert profile_data["email"] == "test_user_profile@example.com"
    assert profile_data["company_name"] == "Acme Inc."
    print("Profile fetch successful!")
    
    # 5. Update Profile
    update_payload = {
        "first_name": "UpdatedName",
        "company_name": "Acme Global"
    }
    update_response = client.put("/profile", json=update_payload, headers=headers)
    assert update_response.status_code == 200, f"Profile update failed: {update_response.text}"
    updated_data = update_response.json()
    assert updated_data["first_name"] == "UpdatedName"
    assert updated_data["company_name"] == "Acme Global"
    print("Profile update successful!")
    
    # 6. Get Profile again to confirm update
    profile_response2 = client.get("/profile", headers=headers)
    assert profile_response2.status_code == 200
    profile_data2 = profile_response2.json()
    assert profile_data2["first_name"] == "UpdatedName"
    assert profile_data2["company_name"] == "Acme Global"
    print("All profile management tests passed successfully!")

if __name__ == "__main__":
    test_user_flow()
