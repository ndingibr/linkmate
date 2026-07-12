"""PayFast configuration and signature helpers.

Config values come from :mod:`app.core.config` (environment-driven); nothing
sensitive is hardcoded here.
"""
import hashlib
from urllib.parse import quote_plus

from app.core.config import settings

MERCHANT_ID = settings.payfast_merchant_id
MERCHANT_KEY = settings.payfast_merchant_key
PROCESS_URL = settings.payfast_process_url

BASE_RETURN_URL = f"{settings.base_url}/pay"
# Public URL PayFast calls back to (ITN). Must be reachable from the internet.
NOTIFY_BASE_URL = f"{settings.base_url}/pay_notify"


def generate_payfast_signature(data: dict, passphrase: str = "") -> str:
    filtered = {
        k: v for k, v in data.items()
        if v not in ("", None) and k != "signature"
    }

    sorted_items = sorted(filtered.items())

    query_string = "&".join(
        f"{k}={quote_plus(str(v))}" for k, v in sorted_items
    )

    if passphrase:
        query_string += f"&passphrase={quote_plus(passphrase)}"

    return hashlib.md5(query_string.encode("utf-8")).hexdigest()
