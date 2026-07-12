from typing import Optional
from app.log import log_contact_message


def save_contact_message(
    first_name: str,
    last_name: str,
    email: str,
    message: str,
    phone: Optional[str] = None,
) -> int:
    """Persist a contact form submission and return the new row id."""
    return log_contact_message(
        first_name=first_name,
        last_name=last_name,
        email=email,
        message=message,
        phone=phone,
    )
