from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings
from app.repositories import user_repo

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Password helper functions
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# JWT helpers
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None

# Dependency to get current logged-in user
def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    user = user_repo.get_user_by_email(email)
    if user is None:
        raise credentials_exception
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return user

# OAuth exchange simulation / logic
async def exchange_google_code(code: str) -> Dict[str, Any]:
    """
    Exchange the authorization code for Google user details.
    In real usage, we would make a POST request to Google's oauth2/token endpoint
    and retrieve the profile. If google_client_id is not set, we'll run a mock/sandbox flow.
    """
    if not settings.google_client_id or not settings.google_client_secret:
        # Sandbox mode helper: return mock details based on code (assumed to be email/username for testing)
        mock_email = f"{code}@gmail.com" if "@" not in code else code
        return {
            "first_name": "Google",
            "last_name": "User",
            "email": mock_email,
            "provider_id": f"google_{code}"
        }
    
    import httpx
    # Real Google OAuth implementation
    try:
        async with httpx.AsyncClient() as client:
            # 1. Exchange code for tokens
            token_url = "https://oauth2.googleapis.com/token"
            data = {
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.oauth_redirect_url,
                "grant_type": "authorization_code"
            }
            token_response = await client.post(token_url, data=data)
            token_response.raise_for_status()
            tokens = token_response.json()
            
            # 2. Get user info
            userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            headers = {"Authorization": f"Bearer {tokens['access_token']}"}
            user_response = await client.get(userinfo_url, headers=headers)
            user_response.raise_for_status()
            user_data = user_response.json()
            
            return {
                "first_name": user_data.get("given_name", "Google"),
                "last_name": user_data.get("family_name", "User"),
                "email": user_data["email"],
                "provider_id": user_data["sub"]
            }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google authentication failed: {str(e)}"
        )

async def exchange_linkedin_code(code: str) -> Dict[str, Any]:
    """
    Exchange the authorization code for LinkedIn user details.
    If linkedin_client_id is not set, we'll run a mock/sandbox flow.
    """
    if not settings.linkedin_client_id or not settings.linkedin_client_secret:
        # Sandbox mode helper: return mock details based on code
        mock_email = f"{code}@linkedin.com" if "@" not in code else code
        return {
            "first_name": "LinkedIn",
            "last_name": "User",
            "email": mock_email,
            "provider_id": f"linkedin_{code}"
        }
    
    import httpx
    # Real LinkedIn OAuth implementation
    try:
        async with httpx.AsyncClient() as client:
            # 1. Exchange code for token
            token_url = "https://www.linkedin.com/oauth/v2/accessToken"
            data = {
                "grant_type": "authorization_code",
                "code": code,
                "client_id": settings.linkedin_client_id,
                "client_secret": settings.linkedin_client_secret,
                "redirect_uri": settings.oauth_redirect_url
            }
            headers = {"Content-Type": "application/x-www-form-urlencoded"}
            token_response = await client.post(token_url, data=data, headers=headers)
            token_response.raise_for_status()
            tokens = token_response.json()
            
            # 2. Retrieve profile & email
            # Profile API
            profile_url = "https://api.linkedin.com/v2/userinfo"
            headers = {"Authorization": f"Bearer {tokens['access_token']}"}
            user_response = await client.get(profile_url, headers=headers)
            user_response.raise_for_status()
            user_data = user_response.json()
            
            return {
                "first_name": user_data.get("given_name", "LinkedIn"),
                "last_name": user_data.get("family_name", "User"),
                "email": user_data["email"],
                "provider_id": user_data["sub"]
            }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"LinkedIn authentication failed: {str(e)}"
        )
