from fastapi import APIRouter, HTTPException, Depends, status
from datetime import timedelta

from app.schemas import (
    UserRegister,
    UserLogin,
    UserProfile,
    UserUpdate,
    TokenResponse,
    OAuthCallback
)
from app.repositories import user_repo
from app.services import auth
from app.core.config import settings

router = APIRouter(tags=["users"])

@router.post("/register", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
def register_user(data: UserRegister):
    if user_repo.email_exists(data.email):
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
        auth_provider="email"
    )
    return user

@router.post("/login", response_model=TokenResponse)
def login_user(data: UserLogin):
    user = user_repo.get_user_by_email(data.email)
    if not user or not user.get("password_hash") or not auth.verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
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
