"""Quote request / quote sending endpoints."""
import json
from typing import Optional

from fastapi import APIRouter, HTTPException, Body

from app.ai import calculate_zim_charges
from app.helper import populate_quote_excel
from app.log import (
    create_quote_request,
    create_quote_item_request,
    get_all_quote_requests,
    get_quote_request_by_id,
    get_quotes_by_phone,
    get_quote_request_by_number,
    get_quote_request,
    insert_or_update_quote,
)
from app.schemas import QuoteRequest

router = APIRouter(tags=["quotes"])


# -----------------------------
# REQUEST QUOTE
# -----------------------------
@router.post("/request_quote")
async def create_quote(q: QuoteRequest):
    try:
        quote_request_id = create_quote_request(
            q.firstName, q.lastName, q.email, q.phone, q.deliveryAddress, q.client_info
        )
        item_ids = []
        for item in q.items:
            item_id = create_quote_item_request(
                quote_request_id, item.name, item.attributes, item.quantity, item.log_id
            )
            item_ids.append(item_id)
        return {
            "status": "success",
            "quote_request_id": quote_request_id,
            "items_saved": len(item_ids),
            "item_ids": item_ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# GET ALL QUOTES
# -----------------------------
@router.get("/quote_requests")
async def get_all_quotes_endpoint():
    try:
        quotes = get_all_quote_requests()
        return quotes if quotes else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# GET QUOTE BY ID
# -----------------------------
@router.get("/request_quote/{quote_id}")
def get_quote_by_id_endpoint(quote_id: int):
    quote = get_quote_request_by_id(quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"status": "success", "quote": quote}


# -----------------------------
# GET QUOTES BY PHONE
# -----------------------------
@router.get("/request_quote/by-phone/{phone}")
def get_quotes_by_phone_endpoint(phone: str):
    quotes = get_quotes_by_phone(phone)
    if not quotes:
        raise HTTPException(status_code=404, detail="No quotes found")
    return {"status": "success", "count": len(quotes), "quotes": quotes}


# -----------------------------
# GET QUOTE BY NUMBER
# -----------------------------
@router.get("/request_quote_by_number/{quote_number}")
def get_quote_by_number_endpoint(quote_number: str):
    quote = get_quote_request_by_number(quote_number)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"status": "success", "quote": quote}


# -----------------------------
# SEND QUOTE
# -----------------------------
@router.post("/send-quote")
def send_quote_endpoint(
    quote_id: Optional[int] = Body(None),
    quote_number: Optional[str] = Body(None),
    price: Optional[float] = Body(None)
):
    # 1 Fetch the original quote request using either ID or number
    quote_request = get_quote_request(quote_id=quote_id, quote_number=quote_number)
    if not quote_request:
        raise HTTPException(status_code=404, detail="Quote request not found")

    # Determine quote_sent_id for numbering
    quote_sent_id = quote_request.get("id")
    quote_sent_no = quote_request.get("quote_no")

    # 2 Process items from the original request
    items = quote_request.get("lines", [])
    charges_list = []

    for idx, item in enumerate(items):
        item_name = item.get("item_name")
        quantity = item.get("quantity", 1)

        # Parse attributes JSON
        attributes_raw = item.get("item_attributes", "{}")
        try:
            attributes = json.loads(attributes_raw)
        except json.JSONDecodeError:
            attributes = {}

        # Join attributes into a readable description
        description = ", ".join(
            f"{key}: {value}" for key, value in attributes.items()
        )

        # Price logic
        item_price = price or item.get("price", 0)

        quote_data = {
            "quote_number": quote_sent_no,
            "item_name": item_name,
            "description": description,
            "quantity": quantity,
            "price": item_price,
            "delivery_address": quote_request.get("delivery_address"),
            "category": item.get("classification"),
            "freight": item.get("freight"),
            "insurance": item.get("insurance"),
            "clearing_fee": item.get("clearing_fee")
        }

        charges = calculate_zim_charges(quote_data)
        charges_list.append(charges)

    # 3 Generate Excel
    excel_file, total = populate_quote_excel(
        template_path="quote_template.xlsx",
        output_path=f"quote_{quote_sent_no}.xlsx",
        quote_list=charges_list,
        client_info=quote_request
    )

    insert_or_update_quote(id=None, quote_id=quote_sent_id, quote_number=quote_sent_no, paid=False, price=total)

    return excel_file, total
