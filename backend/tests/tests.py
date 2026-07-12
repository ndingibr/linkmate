import sys
import os
import json
from fastapi.testclient import TestClient

# -----------------------------
# Fix import path so 'main.py' can be found
# -----------------------------
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app  # now it works from tests/ folder

# -----------------------------
# Create TestClient
# -----------------------------
client = TestClient(app)

# -----------------------------
# 1️⃣ Test /search Endpoint
# -----------------------------
search_payload = {
    "query": "Engine of a tractor from South Africa",
    "client_info": {
        "user_agent": "TestClient",
        "ip": "127.0.0.1",
        "session_id": "abc123"
    }
}

search_response = client.post("/search", json=search_payload)
print("POST /search status code:", search_response.status_code)

try:
    search_data = search_response.json()
    print("Search response:")
    print(json.dumps(search_data, indent=2))
except Exception as e:
    search_data = {}
    print("Error parsing search JSON:", e)
    print(search_response.text)

# Extract log_id safely
log_id = search_data.get("log_id") if search_data else None

# -----------------------------
# 2️⃣ Test /quote Endpoint
# -----------------------------
quote_payload = {
    "firstName": "Test",
    "lastName": "User",
    "email": "testuser@example.com",
    "phone": "+2630912872",
    "deliveryAddress": "123 Test Street, Harare",
    "item_name": "Lexus ES 300h",
    "item_attributes": {
        "Color": "Red",
        "Year": 2023,
        "Horsepower": 215,
        "Fuel Efficiency Mpg": 44,
        "Safety Ratings": "5-star",
        "Seating Capacity": 5
    },
    "log_id": log_id  # safely use log_id from search
}

post_response = client.post("/quote", json=quote_payload)
print("\nPOST /quote status code:", post_response.status_code)

try:
    post_data = post_response.json()
    print("Quote submission response:")
    print(json.dumps(post_data, indent=2))
except Exception as e:
    print("Error parsing quote JSON:", e)
    print(post_response.text)

# -----------------------------
# 3️⃣ Test /quotes Endpoint
# -----------------------------
get_response = client.get("/quotes")
print("\nGET /quotes status code:", get_response.status_code)

try:
    all_quotes = get_response.json()
    print("All submitted quotes:")
    print(json.dumps(all_quotes, indent=2))
except Exception as e:
    print("Error parsing all quotes JSON:", e)
    print(get_response.text)
