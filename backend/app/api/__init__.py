"""Aggregate all API routers into a single router for the app to include."""
from fastapi import APIRouter

from app.api import health, users, contact, seo, auth

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(users.router)
api_router.include_router(contact.router)
api_router.include_router(seo.router)
api_router.include_router(auth.router)

