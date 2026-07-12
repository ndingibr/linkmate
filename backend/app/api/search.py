"""Generative search endpoints."""
import traceback

from fastapi import APIRouter, HTTPException

from app.ai import classify_search, discover_attributes, retrieve_common_items
from app.log import log_search, get_all_searches
from app.schemas import SearchRequest

router = APIRouter(tags=["search"])


@router.post("/search")
async def search(req: SearchRequest):
    try:
        if not req.query or not req.query.strip():
            raise HTTPException(status_code=400, detail="Query is required")

        classification = classify_search(req.query)
        attributes = discover_attributes(req.query, classification)
        common_items = retrieve_common_items(
            req.query,
            classification,
            attributes,
            country="South Africa"
        )

        log_id = log_search(
            req.query,
            classification,
            attributes,
            common_items,
            req.client_info
        )

        return {
            "log_id": log_id,
            "query": req.query,
            "classification": classification,
            "attributes": attributes,
            "common_items": common_items
        }

    except HTTPException as e:
        # Pass FastAPI errors straight through
        raise e

    except Exception as e:
        # Log full traceback for debugging
        traceback.print_exc()

        # Send actual error message to frontend
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/searches")
async def get_searches():
    searches = get_all_searches()
    return {"count": len(searches), "searches": searches}
