from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.services import earnings_service
from app.repositories import earnings_repo

router = APIRouter()

class AnalysisRequest(BaseModel):
    symbol: str

class ChatRequest(BaseModel):
    query: str
    symbol: Optional[str] = None

@router.get("/earnings/rally/candidates")
async def get_rally_candidates(limit: int = 10):
    """
    Screen upcoming earnings and return the top candidate companies most likely to rally.
    """
    try:
        candidates = earnings_service.screen_candidates(limit=limit)
        return {"status": "success", "count": len(candidates), "candidates": candidates}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Screener execution failed: {str(e)}"
        )

@router.post("/earnings/rally/analyze")
async def analyze_rally_candidate(payload: AnalysisRequest):
    """
    Perform 2-week lookback around past earnings, query LLM for forecast/optimization,
    save to database, and return results.
    """
    try:
        result = earnings_service.analyze_candidate_by_symbol(symbol=payload.symbol)
        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis execution failed: {str(e)}"
        )

@router.get("/earnings/rally/predictions")
async def get_saved_predictions():
    """
    Get all previously generated predictions.
    """
    try:
        predictions = earnings_repo.get_all_earnings_rally_predictions()
        return {"status": "success", "count": len(predictions), "predictions": predictions}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch predictions: {str(e)}"
        )

@router.post("/earnings/rally/chat")
async def chat_query_predictor(payload: ChatRequest):
    """
    Retrieves database predictions and uses GPT-4o-mini to answer conversational
    queries about earnings predictions, entries, exits, actuals, and errors.
    """
    try:
        reply = earnings_service.query_trade_assistant(payload.query, payload.symbol)
        return {"status": "success", "reply": reply}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat query failed: {str(e)}"
        )
