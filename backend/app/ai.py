# ai.py
import openai
import json
import re

from app.core.config import settings

# -----------------------------
# 1. Setup
# -----------------------------
openai.api_key = settings.openai_api_key
client = openai
MODEL = settings.openai_model

# -----------------------------
# 2. Helper Functions
# -----------------------------
def parse_json_response(raw_text: str):
    """
    Clean up ChatGPT JSON responses and convert to Python object
    """
    cleaned = re.sub(r"^```json\s*|\s*```$", "", raw_text.strip(), flags=re.MULTILINE)

    # Clean up leading '+' signs on numbers which are invalid in standard JSON syntax
    cleaned = re.sub(r'(?<=[:,\[])\s*\+\s*(\d+)', r' \1', cleaned)

    if not cleaned:
        return {}  # default to dict

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        print("JSON parse error:", e)
        print("Raw content:", raw_text)
        return {}


def format_attribute_key(key: str) -> str:
    """
    Convert snake_case keys to Title Case for UI display
    e.g. number_of_cylinders -> Number of Cylinders
    """
    small_words = {"of", "and", "for", "to"}

    words = key.replace("_", " ").split()
    formatted = []

    for i, word in enumerate(words):
        if i != 0 and word.lower() in small_words:
            formatted.append(word.lower())
        else:
            formatted.append(word.capitalize())

    return " ".join(formatted)


def normalize_attributes(attrs: dict) -> dict:
    """
    Apply UI-friendly formatting to attribute keys
    """
    if not isinstance(attrs, dict):
        return attrs

    return {
        format_attribute_key(k): v
        for k, v in attrs.items()
    }


# -----------------------------
# 3. AI Functions
# -----------------------------
def classify_search(query: str) -> dict:
    prompt = f"""
Classify the following search query.

Return JSON ONLY with:
- entity_type (product, service, location, idea)
- domain (automotive, real_estate, insurance, electronics, etc.)
- intent (research, compare, buy, quote)
- product (specific product name or category, e.g. "smartphone", "car insurance", "laptop")

Search: "{query}"
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )

    item = parse_json_response(response.choices[0].message.content)

    if not isinstance(item, dict):
        return {}

    return item



def discover_attributes(query: str, classification: dict) -> list:
    prompt = f"""
For the search "{query}":

Product: {classification.get("product", "N/A")}
Domain: {classification.get("domain", "N/A")}
Entity type: {classification.get("entity_type", "N/A")}

List the key attributes required to compare when buying "{query}".
Do NOT give values Please exclude availability.

Return JSON ARRAY ONLY.
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )

    items = parse_json_response(response.choices[0].message.content)

    if not isinstance(items, list):
        return []

    return [a for a in items if isinstance(a, str)]

def retrieve_common_items(
    query: str,
    classification: dict,
    attributes: list,
    country: str = "South Africa"
) -> list:

    # attributes is list[str]
    attr_names = [a for a in attributes if isinstance(a, str)]

    if not attr_names:
        attr_names = ["price", "brand"]

    attr_text = ", ".join(attr_names)

    prompt = f"""
For the search "{query}" in {country}:

Domain: {classification.get("domain")}
Entity type: {classification.get("entity_type")}
Intent: {classification.get("intent")}

List the 9 (nine) most common items available locally.

For EACH item return:
- name
- short_description
- attributes (JSON OBJECT where keys are attribute names and values are strings.
  You MUST include:
  - price_range (formatted in ZAR, e.g. "ZAR 5,000 – 7,500")
  Use only relevant attributes from this list: {attr_text})

Return a JSON ARRAY ONLY.
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )

    items = parse_json_response(response.choices[0].message.content)

    if not isinstance(items, list):
        return []

    for item in items:
        if isinstance(item, dict) and isinstance(item.get("attributes"), dict):
            item["attributes"] = normalize_attributes(item["attributes"])

    return items

def get_estimated_price_and_category(item_name: str) -> dict:
    """
    Ask ChatGPT to provide an estimated average price in South Africa
    and the category of the item.
    """
    prompt = f"""
Provide the average retail price in South Africa (ZAR) and the category
for the following item. Return JSON ONLY with keys:
- price
- category
- recommended_charges (optional: freight, insurance, clearing_fee)

Item: "{item_name}"
"""
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        data = parse_json_response(response.choices[0].message.content)

        # Ensure numeric values
        data["price"] = float(data.get("price", 0))
        return data

    except Exception as e:
        print("Error getting estimate from ChatGPT:", e)
        return {"price": 0, "category": None, "recommended_charges": {}}

# -----------------------------
# 4. Quote Cost Calculation
# -----------------------------
def calculate_zim_charges(quote: dict) -> dict:
    """
    Calculate all import charges for sending goods from South Africa to Zimbabwe.
    Auto-fills missing price, freight, insurance, clearing fee using ChatGPT.
    """
    # 1. Ensure price is set
    base_price = float(quote.get("price", 0))
    quantity = float(quote.get("quantity", 1))
    item_name = quote.get("item_name", "Item")
    description = quote.get("description", "description")

    if base_price >= 0:
        estimates = get_estimated_price_and_category(item_name)
        base_price = estimates.get("price", 0)
        quote["category"] = estimates.get("category")
        recommended_charges = estimates.get("recommended_charges", {})
        # Fill recommended charges if available
        quote["freight"] = quote.get("freight") or recommended_charges.get("freight", 200)
        quote["insurance"] = quote.get("insurance") or recommended_charges.get("insurance", round(base_price*0.01,2))
        quote["clearing_fee"] = quote.get("clearing_fee") or recommended_charges.get("clearing_fee", 75)

    else:
        # Fill missing charges if price exists
        quote["freight"] = quote.get("freight") or 0
        quote["insurance"] = quote.get("insurance") or round(base_price*0.01,2)
        quote["clearing_fee"] = quote.get("clearing_fee") or 0

    # CIF = Cost + Insurance + Freight
    cif_value = base_price + quote["freight"] + quote["insurance"]

    # Customs duty (estimate from category; default 25%)
    duty_rate = 0.25
    duty = cif_value * duty_rate

    # VAT 15% on CIF + duty
    vat_rate = 0.15
    vat = (cif_value + duty) * vat_rate

    # Total payable
    total = cif_value + duty + vat + quote["clearing_fee"]

    # Construct breakdown
    charges = {
        "base_price": round(base_price,2),
        "freight": round(quote["freight"],2),
        "insurance": round(quote["insurance"],2),
        "cif_value": round(cif_value,2),
        "customs_duty": round(duty,2),
        "vat": round(vat,2),
        "clearing_fee": round(quote["clearing_fee"],2),
        "total_payable": round(total,2),
        "quote_number": quote.get("quote_number"),
        "item_name": item_name,
        "description": description,
        "quantity": quantity,
        "delivery_address": quote.get("delivery_address"),
        "category": quote.get("category")
    }

    return charges

