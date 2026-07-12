"""Aggregate all API routers into a single router for the app to include."""
from fastapi import APIRouter

from app.api import health, search, quotes, payments, earnings, users, contact, predictor_v3

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(earnings.router)
api_router.include_router(search.router)
api_router.include_router(quotes.router)
api_router.include_router(payments.router)
api_router.include_router(users.router)
api_router.include_router(contact.router)
api_router.include_router(predictor_v3.router)

