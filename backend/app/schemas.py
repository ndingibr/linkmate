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


class UserSignUp(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    company_name: Optional[str] = None
    password: str


class UserSignIn(BaseModel):
    email: EmailStr
    password: str


class UserIntentSchema(BaseModel):
    id: int
    industry_id: int
    industry_name: str
    sub_industry_id: int
    sub_industry_name: str
    type: str
    intention: str


class UserIntentCreate(BaseModel):
    industry_id: Optional[int] = None
    industry_name: Optional[str] = None
    sub_industry_id: Optional[int] = None
    sub_industry_name: Optional[str] = None
    type: str
    intention: str


class UserProfile(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    company_name: Optional[str] = None
    auth_provider: str
    is_active: bool
    created_at: datetime
    intent: Optional[str] = None
    role: Optional[str] = None
    influence: Optional[str] = None
    has_budget: Optional[bool] = False
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    budget_currency: Optional[str] = "ZAR"
    comm_channel: Optional[str] = None
    comm_hours: Optional[str] = None
    intent_lifespan: Optional[str] = None
    location: Optional[str] = None
    intent_active: Optional[bool] = True
    photo: Optional[str] = None
    intents: Optional[List[UserIntentSchema]] = None


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    intent: Optional[str] = None
    role: Optional[str] = None
    influence: Optional[str] = None
    has_budget: Optional[bool] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    budget_currency: Optional[str] = None
    comm_channel: Optional[str] = None
    comm_hours: Optional[str] = None
    intent_lifespan: Optional[str] = None
    location: Optional[str] = None
    intent_active: Optional[bool] = None
    photo: Optional[str] = None


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


class MessageCreate(BaseModel):
    recipient_id: int
    subject: str
    body: str


class MessageResponse(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    subject: str
    body: str
    is_read: bool
    sent_at: datetime
    sender_first_name: Optional[str] = None
    sender_last_name: Optional[str] = None
    sender_company: Optional[str] = None
    sender_photo: Optional[str] = None
    recipient_first_name: Optional[str] = None
    recipient_last_name: Optional[str] = None
    recipient_company: Optional[str] = None
    recipient_photo: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    password: str


class UserActivateRequest(BaseModel):
    email: EmailStr
    otp_code: str
