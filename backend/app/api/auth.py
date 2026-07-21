from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import RedirectResponse, HTMLResponse
import urllib.parse

from app.core.config import settings
from app.services.auth import exchange_google_code, exchange_linkedin_code, create_access_token
from app.repositories import user_repo

router = APIRouter(prefix="/auth", tags=["auth"])

def get_frontend_url(request: Request) -> str:
    host = request.headers.get("host", "").lower()
    if "localhost" in host or "127.0.0.1" in host:
        return "http://localhost:5173"
    return settings.base_url

@router.get("/google")
async def google_login(request: Request):
    frontend_url = get_frontend_url(request)
    redirect_uri = f"{frontend_url.rstrip('/')}/auth/callback" if "localhost" in frontend_url else f"{settings.base_url.rstrip('/')}/auth/callback"
    
    if not settings.google_client_id or settings.google_client_id == "mock":
        # Redirect to simulated sandbox login page
        return RedirectResponse(
            url=f"/auth/mock-oauth-login?provider=google&redirect_uri={urllib.parse.quote(redirect_uri)}"
        )
        
    # Real Google authorization redirect
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid profile email",
        "state": "google"
    }
    url = "https://accounts.google.com/o/oauth2/auth?" + urllib.parse.urlencode(params)
    return RedirectResponse(url=url)

@router.get("/linkedin")
async def linkedin_login(request: Request):
    frontend_url = get_frontend_url(request)
    redirect_uri = f"{frontend_url.rstrip('/')}/auth/callback" if "localhost" in frontend_url else f"{settings.base_url.rstrip('/')}/auth/callback"
    
    if not settings.linkedin_client_id or settings.linkedin_client_id == "mock":
        # Redirect to simulated sandbox login page
        return RedirectResponse(
            url=f"/auth/mock-oauth-login?provider=linkedin&redirect_uri={urllib.parse.quote(redirect_uri)}"
        )
        
    # Real LinkedIn authorization redirect
    params = {
        "client_id": settings.linkedin_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid profile email",
        "state": "linkedin"
    }
    url = "https://www.linkedin.com/oauth/v2/authorization?" + urllib.parse.urlencode(params)
    return RedirectResponse(url=url)

@router.get("/callback")
async def oauth_callback(request: Request, code: str, state: str):
    provider = state
    if provider not in ["google", "linkedin"]:
        raise HTTPException(status_code=400, detail="Invalid provider state")
        
    frontend_url = get_frontend_url(request)
    redirect_uri = f"{frontend_url.rstrip('/')}/auth/callback" if "localhost" in frontend_url else f"{settings.base_url.rstrip('/')}/auth/callback"
        
    # Exchange code for user details
    if provider == "google":
        user_info = await exchange_google_code(code, redirect_uri=redirect_uri)
    else:
        user_info = await exchange_linkedin_code(code, redirect_uri=redirect_uri)
        
    # Check if user exists
    user = user_repo.get_user_by_email(user_info["email"])
    if not user:
        # Create user account with active status since authenticated via OAuth
        user = user_repo.create_user(
            first_name=user_info["first_name"],
            last_name=user_info["last_name"],
            email=user_info["email"],
            auth_provider=provider,
            provider_id=user_info["provider_id"],
            is_active=True
        )
    else:
        # Verify provider ID or link user if needed
        if not user.get("provider_id"):
            from app.core.db import get_conn
            conn = get_conn()
            c = conn.cursor()
            c.execute(
                "UPDATE users SET auth_provider = %s, provider_id = %s, is_active = TRUE WHERE id = %s",
                (provider, user_info["provider_id"], user["id"])
            )
            conn.commit()
            conn.close()
            user = user_repo.get_user_by_id(user["id"])
            
    # Generate JWT token
    access_token = create_access_token(data={"sub": user["email"], "uid": user["id"]})
    
    frontend_url = get_frontend_url(request)
    return RedirectResponse(url=f"{frontend_url}/?token={access_token}")

@router.get("/mock-oauth-login", response_class=HTMLResponse)
async def mock_oauth_login(provider: str, redirect_uri: str):
    provider_title = provider.capitalize()
    color_theme = "#4285F4" if provider == "google" else "#0A66C2"
    
    # Custom premium design page for mock login
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Simulated {provider_title} Login</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
        <style>
            body {{
                font-family: 'Inter', sans-serif;
                background-color: #f3f4f6;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
            }}
            .card {{
                background-color: #ffffff;
                border-radius: 16px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                padding: 40px;
                width: 100%;
                max-width: 400px;
                text-align: center;
                border: 1px solid #e5e7eb;
            }}
            h2 {{
                font-family: 'Outfit', sans-serif;
                color: #35453f;
                margin-bottom: 8px;
            }}
            p {{
                color: #6b7280;
                font-size: 0.9rem;
                margin-bottom: 24px;
                line-height: 1.4;
            }}
            .input-group {{
                text-align: left;
                margin-bottom: 16px;
            }}
            label {{
                display: block;
                font-size: 0.8rem;
                font-weight: 600;
                color: #374151;
                margin-bottom: 6px;
            }}
            input {{
                width: 100%;
                padding: 10px 14px;
                border-radius: 8px;
                border: 1px solid #d1d5db;
                font-size: 0.9rem;
                box-sizing: border-box;
                outline: none;
            }}
            input:focus {{
                border-color: {color_theme};
            }}
            button {{
                width: 100%;
                background-color: {color_theme};
                color: white;
                border: none;
                padding: 12px;
                border-radius: 8px;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                margin-top: 10px;
                font-family: 'Outfit', sans-serif;
            }}
            button:hover {{
                opacity: 0.9;
            }}
            .divider {{
                margin: 20px 0;
                border-top: 1px solid #e5e7eb;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <h2>Simulated {provider_title} Authentication</h2>
            <p>You are viewing the simulated Small Circles authentication sandbox because no real credentials are set in the environment.</p>
            
            <form action="/auth/mock-callback" method="GET">
                <input type="hidden" name="provider" value="{provider}" />
                <input type="hidden" name="redirect_uri" value="{redirect_uri}" />
                
                <div class="input-group">
                    <label>First Name</label>
                    <input type="text" name="first_name" value="Brian" required />
                </div>
                <div class="input-group">
                    <label>Last Name</label>
                    <input type="text" name="last_name" value="Ndigindwayo" required />
                </div>
                <div class="input-group">
                    <label>Email Address</label>
                    <input type="email" name="email" value="ndingibr@gmail.com" required />
                </div>
                
                <button type="submit">Sign In as Mock User</button>
            </form>
        </div>
    </body>
    </html>
    """

@router.get("/mock-callback")
async def mock_callback(
    request: Request,
    provider: str,
    email: str,
    first_name: str,
    last_name: str,
    redirect_uri: str
):
    # Find or create user
    user = user_repo.get_user_by_email(email)
    if not user:
        user = user_repo.create_user(
            first_name=first_name,
            last_name=last_name,
            email=email,
            auth_provider=provider,
            provider_id=f"mock_{provider}_{email.replace('@', '_')}",
            is_active=True
        )
    else:
        # Link mock provider if not set
        if not user.get("provider_id"):
            from app.core.db import get_conn
            conn = get_conn()
            c = conn.cursor()
            c.execute(
                "UPDATE users SET auth_provider = %s, provider_id = %s, is_active = TRUE WHERE id = %s",
                (provider, f"mock_{provider}_{email.replace('@', '_')}", user["id"])
            )
            conn.commit()
            conn.close()
            user = user_repo.get_user_by_id(user["id"])
            
    # Generate JWT token
    access_token = create_access_token(data={"sub": user["email"], "uid": user["id"]})
    
    frontend_url = get_frontend_url(request)
    return RedirectResponse(url=f"{frontend_url}/?token={access_token}")
