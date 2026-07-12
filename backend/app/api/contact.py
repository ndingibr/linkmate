"""Contact form API endpoint."""
import logging
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

from app.schemas import ContactMessage
from app.repositories import contact_repo

logger = logging.getLogger(__name__)

router = APIRouter(tags=["contact"])


@router.post("/contact", status_code=status.HTTP_200_OK)
async def submit_contact(data: ContactMessage):
    """
    Receive and persist a contact form submission.

    The message is stored in the ``contact_messages`` table.
    Can be extended to also send an email notification.
    """
    try:
        row_id = contact_repo.save_contact_message(
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            message=data.message,
            phone=data.phone,
        )
        logger.info(
            "Contact message #%d saved from %s %s <%s>",
            row_id,
            data.first_name,
            data.last_name,
            data.email,
        )
    except Exception as exc:
        logger.exception("Failed to save contact message: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save your message. Please try again later.",
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "success",
            "message": "Thank you for reaching out! We will get back to you soon.",
        },
    )
