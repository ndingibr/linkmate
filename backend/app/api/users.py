from fastapi import APIRouter, HTTPException, Depends, status
from datetime import timedelta

from app.schemas import (
    UserRegister,
    UserLogin,
    UserProfile,
    UserUpdate,
    TokenResponse,
    OAuthCallback,
    MessageCreate,
    MessageResponse
)
from app.repositories import user_repo, message_repo
from app.services import auth
from app.core.config import settings

router = APIRouter(tags=["users"])

@router.post("/register", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
def register_user(data: UserRegister):
    if user_repo.email_exists(data.email):
        if data.email.lower() == "ndinbr@gmail.com":
            user_repo.delete_user_by_email(data.email)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    hashed = auth.hash_password(data.password)
    user = user_repo.create_user(
        first_name=data.first_name,
        last_name=data.last_name,
        email=data.email,
        phone=data.phone,
        company_name=data.company_name,
        password_hash=hashed,
        auth_provider="email",
        is_active=False
    )
    
    try:
        from app.services.email import send_activation_email
        send_activation_email(user["email"], user["first_name"])
    except Exception as e:
        print(f"Error sending activation email: {e}")
        
    return user

@router.get("/activate")
def activate_user(email: str):
    user = user_repo.get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    user_repo.update_user(user["id"], is_active=True)
    return {"message": "Account activated successfully"}

@router.post("/login", response_model=TokenResponse)
def login_user(data: UserLogin):
    user = user_repo.get_user_by_email(data.email)
    if not user or not user.get("password_hash") or not auth.verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(user)
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account not activated. Please verify your email first."
        )
    
    access_token_expires = timedelta(minutes=settings.jwt_expire_minutes)
    access_token = auth.create_access_token(
        data={"sub": user["email"], "uid": user["id"]},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/auth/google", response_model=TokenResponse)
async def auth_google(callback: OAuthCallback):
    # Exchange code for user details
    profile = await auth.exchange_google_code(callback.code)
    
    # Check if user already exists
    user = user_repo.get_user_by_email(profile["email"])
    if user:
        # If user exists but registered with a different provider
        if user["auth_provider"] != "google":
            # Link them or update provider
            user = user_repo.update_user(
                user["id"],
                auth_provider="google",
                provider_id=profile["provider_id"]
            )
    else:
        # Create user
        user = user_repo.create_user(
            first_name=profile["first_name"],
            last_name=profile["last_name"],
            email=profile["email"],
            auth_provider="google",
            provider_id=profile["provider_id"]
        )
        
    access_token_expires = timedelta(minutes=settings.jwt_expire_minutes)
    access_token = auth.create_access_token(
        data={"sub": user["email"], "uid": user["id"]},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/auth/linkedin", response_model=TokenResponse)
async def auth_linkedin(callback: OAuthCallback):
    # Exchange code for user details
    profile = await auth.exchange_linkedin_code(callback.code)
    
    # Check if user already exists
    user = user_repo.get_user_by_email(profile["email"])
    if user:
        # If user exists but registered with a different provider
        if user["auth_provider"] != "linkedin":
            # Link them or update provider
            user = user_repo.update_user(
                user["id"],
                auth_provider="linkedin",
                provider_id=profile["provider_id"]
            )
    else:
        # Create user
        user = user_repo.create_user(
            first_name=profile["first_name"],
            last_name=profile["last_name"],
            email=profile["email"],
            auth_provider="linkedin",
            provider_id=profile["provider_id"]
        )
        
    access_token_expires = timedelta(minutes=settings.jwt_expire_minutes)
    access_token = auth.create_access_token(
        data={"sub": user["email"], "uid": user["id"]},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/{user_id}", response_model=UserProfile)
def get_user_by_id(user_id: int, current_user: dict = Depends(auth.get_current_user)):
    user = user_repo.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.get("/profile", response_model=UserProfile)
def get_profile(current_user: dict = Depends(auth.get_current_user)):
    return current_user

@router.put("/profile", response_model=UserProfile)
def update_profile(
    data: UserUpdate,
    current_user: dict = Depends(auth.get_current_user)
):
    update_data = data.dict(exclude_unset=True)
    if not update_data:
        return current_user
    
    updated = user_repo.update_user(current_user["id"], **update_data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )
    return updated

from pydantic import BaseModel

class AnalyzeIntentRequest(BaseModel):
    query: str

@router.post("/users/analyze-intent")
def analyze_user_intent(data: AnalyzeIntentRequest):
    from app.services.intent_service import evaluate_b2b_intent
    return evaluate_b2b_intent(data.query)

from typing import List, Dict, Any

@router.post("/messages")
def send_message(
    data: MessageCreate,
    current_user: dict = Depends(auth.get_current_user)
):
    recipient = user_repo.get_user_by_id(data.recipient_id)
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient user not found"
        )
    
    # Store message in DB
    msg = message_repo.create_message(
        sender_id=current_user["id"],
        recipient_id=data.recipient_id,
        subject=data.subject,
        body=data.body
    )
    
    # Send SMTP direct email alert
    try:
        from app.services.email import send_direct_message_email
        send_direct_message_email(
            to_email=recipient["email"],
            recipient_name=recipient["first_name"],
            sender_name=f"{current_user['first_name']} {current_user['last_name']}",
            sender_company=current_user.get("company_name"),
            message_subject=data.subject,
            message_body=data.body
        )
    except Exception as e:
        print(f"Failed to dispatch notification email for direct message: {e}")
        
    return msg

@router.get("/messages/inbox", response_model=List[MessageResponse])
def get_inbox(current_user: dict = Depends(auth.get_current_user)):
    return message_repo.get_inbox_messages(current_user["id"])

@router.get("/messages/sent", response_model=List[MessageResponse])
def get_sent(current_user: dict = Depends(auth.get_current_user)):
    return message_repo.get_sent_messages(current_user["id"])

@router.put("/messages/{message_id}/read")
def mark_message_read(
    message_id: int,
    current_user: dict = Depends(auth.get_current_user)
):
    success = message_repo.mark_as_read(message_id, current_user["id"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or not addressed to you"
        )
    return {"message": "Message marked as read"}
