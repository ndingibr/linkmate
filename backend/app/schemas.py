from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr


class SearchRequest(BaseModel):
    query: str
    client_info: Optional[Dict]


class QuoteItem(BaseModel):
    name: str
    attributes: Dict[str, Any]
    quantity: int
    log_id: int


class QuoteRequest(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: Optional[str] = None
    deliveryAddress: str
    client_info: Optional[Dict] = None
    items: List[QuoteItem]


class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    company_name: Optional[str] = None
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserProfile(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    company_name: Optional[str] = None
    auth_provider: str
    created_at: datetime


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class OAuthCallback(BaseModel):
    code: str
    state: Optional[str] = None


class ContactMessage(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str
