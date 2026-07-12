"""PayFast payment redirect endpoint."""
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse

from app.core.config import settings
from app.log import get_quote_request_by_number
from app.services.payfast import (
    MERCHANT_ID,
    MERCHANT_KEY,
    PROCESS_URL,
    BASE_RETURN_URL,
    NOTIFY_BASE_URL,
    generate_payfast_signature,
)

router = APIRouter(tags=["payments"])


@router.get("/pay_quote/{quote_number}", response_class=HTMLResponse)
def pay_quote_endpoint(quote_number: str):
    quote = get_quote_request_by_number(quote_number)

    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    try:
        amount = float(quote["price"])
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid quote amount")
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid price format")

    # Clean phone number
    phone = quote.get("phone", "")
    if phone:
        phone = str(phone).replace("+", "").replace(" ", "").replace("-", "")

    RETURN_URL = f"{BASE_RETURN_URL}/{quote_number}"
    CANCEL_URL = f"{BASE_RETURN_URL}/{quote_number}"
    NOTIFY_URL = f"{NOTIFY_BASE_URL}/{quote_number}"

    payfast_data = {
        "merchant_id": MERCHANT_ID,
        "merchant_key": MERCHANT_KEY,
        "return_url": RETURN_URL,
        "cancel_url": CANCEL_URL,
        "notify_url": NOTIFY_URL,
        "name_first": quote.get("first_name", "")[:255],
        "name_last": quote.get("last_name", "")[:255],
        "email_address": quote.get("email", "")[:255],
        "cell_number": phone[:20],
        "m_payment_id": quote_number[:100],
        "amount": f"{amount:.2f}",
        "currency": "ZAR",
        "item_name": f"Quote {quote_number}"[:100],
        "item_description": "Service Quote Payment"[:255],
        "email_confirmation": "1",
        "confirmation_address": settings.payfast_confirmation_email,
        "payment_method": "cc",
    }

    # Remove empty values for signature calculation
    clean_data = {k: v for k, v in payfast_data.items() if v not in ("", None)}

    # Generate signature (add passphrase if required)
    signature = generate_payfast_signature(clean_data, passphrase=settings.payfast_passphrase)

    # Add signature to form data
    payfast_data["signature"] = signature

    # Generate form
    form_inputs = "\n".join(
        f'<input type="hidden" name="{k}" value="{v}"/>'
        for k, v in payfast_data.items()
        if v not in ("", None)
    )

    return HTMLResponse(f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Redirecting to Payment...</title>
    </head>
    <body onload="document.forms[0].submit()">
        <form method="post" action="{PROCESS_URL}">
            {form_inputs}
        </form>
        <div style="text-align: center; margin-top: 50px;">
            <h2>Redirecting to secure payment gateway...</h2>
            <p>If you are not redirected automatically, click the button below.</p>
            <button onclick="document.forms[0].submit()">Proceed to Payment</button>
        </div>
    </body>
    </html>
    """)
