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
    MessageResponse,
    UserIntentCreate,
    UserIntentSchema,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserActivateRequest
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
        import random
        otp_code = "".join([str(random.randint(0, 9)) for _ in range(6)])
        user_repo.create_otp(user["email"], otp_code, "activation")
        
        from app.services.email import send_activation_otp_email
        send_activation_otp_email(user["email"], user["first_name"], otp_code)
    except Exception as e:
        print(f"Error sending activation OTP email: {e}")
        
    return user


@router.post("/activate")
def activate_user(data: UserActivateRequest):
    user = user_repo.get_user_by_email(data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    is_valid = user_repo.verify_otp(data.email, data.otp_code, "activation")
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )
        
    user_repo.update_user(user["id"], is_active=True)
    user_repo.delete_otp(data.email, "activation")
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
    

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    user = user_repo.get_user_by_email(data.email)
    if user:
        import random
        otp_code = "".join([str(random.randint(0, 9)) for _ in range(6)])
        user_repo.create_otp(user["email"], otp_code, "reset")
        try:
            from app.services.email import send_password_reset_otp_email
            send_password_reset_otp_email(
                to_email=user["email"],
                first_name=user["first_name"],
                otp_code=otp_code
            )
        except Exception as e:
            print(f"Failed to send reset OTP email: {e}")
            
    return {"message": "If an account matches that email, a 6-digit verification code has been sent."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest):
    is_valid = user_repo.verify_otp(data.email, data.otp_code, "reset")
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")
        
    user = user_repo.get_user_by_email(data.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    new_hash = auth.hash_password(data.password)
    user_repo.update_user(user["id"], password_hash=new_hash, is_active=True)
    user_repo.delete_otp(data.email, "reset")
    return {"message": "Password reset successful. You can now log in with your new password."}


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

@router.get("/users/industries")
def get_industries():
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT i.id as industry_id, i.name as industry_name, 
               s.id as sub_industry_id, s.name as sub_industry_name
        FROM industries i
        LEFT JOIN industry_sub_industries isi ON i.id = isi.industry_id
        LEFT JOIN sub_industries s ON isi.sub_industry_id = s.id
        ORDER BY i.name ASC, s.name ASC
    """)
    rows = c.fetchall()
    conn.close()
    
    industries_dict = {}
    for row in rows:
        ind_id = row["industry_id"]
        if ind_id not in industries_dict:
            industries_dict[ind_id] = {
                "id": ind_id,
                "name": row["industry_name"],
                "sub_industries": []
            }
        if row["sub_industry_id"]:
            industries_dict[ind_id]["sub_industries"].append({
                "id": row["sub_industry_id"],
                "name": row["sub_industry_name"]
            })
            
    return list(industries_dict.values())


# GET /users/matches
@router.get("/users/matches")
def get_user_matches(current_user: dict = Depends(auth.get_current_user)):
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT m.id, m.user_id_1, m.user_id_2, m.score, m.status, m.match_reason, m.created_at,
               u1.first_name as u1_first_name, u1.last_name as u1_last_name, u1.company_name as u1_company_name, u1.photo as u1_photo, u1.intent as u1_intent, u1.email as u1_email, u1.phone as u1_phone, u1.role as u1_role,
               u2.first_name as u2_first_name, u2.last_name as u2_last_name, u2.company_name as u2_company_name, u2.photo as u2_photo, u2.intent as u2_intent, u2.email as u2_email, u2.phone as u2_phone, u2.role as u2_role
        FROM matches m
        JOIN users u1 ON m.user_id_1 = u1.id
        JOIN users u2 ON m.user_id_2 = u2.id
        WHERE m.user_id_1 = %s OR m.user_id_2 = %s
    """, (current_user["id"], current_user["id"]))
    rows = c.fetchall()
    conn.close()
    
    matches = []
    for r in rows:
        match_dict = dict(r)
        # Determine who the partner is
        if match_dict["user_id_1"] == current_user["id"]:
            partner_prefix = "u2_"
        else:
            partner_prefix = "u1_"
            
        partner_details = {
            "id": match_dict["user_id_2"] if match_dict["user_id_1"] == current_user["id"] else match_dict["user_id_1"],
            "first_name": match_dict[f"{partner_prefix}first_name"],
            "last_name": match_dict[f"{partner_prefix}last_name"],
            "company_name": match_dict[f"{partner_prefix}company_name"],
            "photo": match_dict[f"{partner_prefix}photo"],
            "intent": match_dict[f"{partner_prefix}intent"],
            "email": match_dict[f"{partner_prefix}email"],
            "phone": match_dict[f"{partner_prefix}phone"],
            "role": match_dict[f"{partner_prefix}role"]
        }
        
        matches.append({
            "id": match_dict["id"],
            "score": float(match_dict["score"]),
            "status": match_dict["status"],
            "match_reason": match_dict["match_reason"],
            "created_at": match_dict["created_at"],
            "partner": partner_details,
            "user_id_1": match_dict["user_id_1"],
            "user_id_2": match_dict["user_id_2"]
        })
    return matches


@router.get("/users/{user_id}", response_model=UserProfile)
def get_user_by_id(user_id: int, current_user: dict = Depends(auth.get_current_user)):
    user = user_repo.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT ui.id, ui.industry_id, i.name as industry_name, 
               ui.sub_industry_id, s.name as sub_industry_name, 
               ui.type, ui.intention
        FROM user_intents ui
        JOIN industries i ON ui.industry_id = i.id
        JOIN sub_industries s ON ui.sub_industry_id = s.id
        WHERE ui.user_id = %s
        ORDER BY ui.created_at DESC
    """, (user_id,))
    rows = c.fetchall()
    conn.close()
    
    user_dict = dict(user)
    user_dict["intents"] = [dict(r) for r in rows]
    return user_dict

@router.get("/profile", response_model=UserProfile)
def get_profile(current_user: dict = Depends(auth.get_current_user)):
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT ui.id, ui.industry_id, i.name as industry_name, 
               ui.sub_industry_id, s.name as sub_industry_name, 
               ui.type, ui.intention
        FROM user_intents ui
        JOIN industries i ON ui.industry_id = i.id
        JOIN sub_industries s ON ui.sub_industry_id = s.id
        WHERE ui.user_id = %s
        ORDER BY ui.created_at DESC
    """, (current_user["id"],))
    rows = c.fetchall()
    conn.close()
    
    user_profile_dict = dict(current_user)
    user_profile_dict["intents"] = [dict(r) for r in rows]
    return user_profile_dict

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
        
    # If the user updated their B2B matchmaking intention statement,
    # run the AI extraction in the backend to populate their B2B segment intents
    if "intent" in update_data and update_data["intent"] is not None:
        intent_text = update_data["intent"].strip()
        from app.services.intent_service import extract_intent_segments
        segments = extract_intent_segments(intent_text)
        
        conn = get_conn()
        c = conn.cursor()
        try:
            # Delete old segments
            c.execute("DELETE FROM user_intents WHERE user_id = %s", (current_user["id"],))
            
            for s in segments:
                ind_name = s["industry"].strip()
                sub_name = s["sub_industry"].strip()
                
                # Resolve Industry
                c.execute("SELECT id FROM industries WHERE LOWER(name) = LOWER(%s)", (ind_name,))
                row = c.fetchone()
                if row:
                    industry_id = row["id"]
                else:
                    c.execute("INSERT INTO industries (name) VALUES (%s) RETURNING id", (ind_name,))
                    industry_id = c.fetchone()["id"]
                    
                # Resolve Sub-Industry
                c.execute("SELECT id FROM sub_industries WHERE LOWER(name) = LOWER(%s)", (sub_name,))
                row = c.fetchone()
                if row:
                    sub_industry_id = row["id"]
                else:
                    c.execute("INSERT INTO sub_industries (name) VALUES (%s) RETURNING id", (sub_name,))
                    sub_industry_id = c.fetchone()["id"]
                    
                # Link Industry and Sub-Industry
                c.execute("""
                    INSERT INTO industry_sub_industries (industry_id, sub_industry_id)
                    VALUES (%s, %s) ON CONFLICT DO NOTHING
                """, (industry_id, sub_industry_id))
                
                # Insert the segment intent
                c.execute("""
                    INSERT INTO user_intents (user_id, industry_id, sub_industry_id, type, intention)
                    VALUES (%s, %s, %s, %s, %s)
                """, (current_user["id"], industry_id, sub_industry_id, s["type"], s["intention"]))
                
            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f"Error updating user B2B segments: {e}")
        finally:
            conn.close()
            
    # Attach updated intents list to return response
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT ui.id, ui.industry_id, i.name as industry_name, 
               ui.sub_industry_id, s.name as sub_industry_name, 
               ui.type, ui.intention
        FROM user_intents ui
        JOIN industries i ON ui.industry_id = i.id
        JOIN sub_industries s ON ui.sub_industry_id = s.id
        WHERE ui.user_id = %s
        ORDER BY ui.created_at DESC
    """, (current_user["id"],))
    rows = c.fetchall()
    conn.close()
    
    updated_dict = dict(updated)
    updated_dict["intents"] = [dict(r) for r in rows]
    return updated_dict

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
    
    # Check if either user is admin/staff (email domain @linkmate.co.za)
    is_staff = (
        (current_user.get("email") and current_user["email"].endswith("@linkmate.co.za")) or 
        (recipient.get("email") and recipient["email"].endswith("@linkmate.co.za"))
    )
    
    if not is_staff:
        # Verify mutual connection exists
        from app.core.db import get_conn
        conn = get_conn()
        c = conn.cursor()
        c.execute("""
            SELECT status FROM matches 
            WHERE ((user_id_1 = %s AND user_id_2 = %s) OR (user_id_1 = %s AND user_id_2 = %s))
              AND status = 'connected'
        """, (current_user["id"], data.recipient_id, data.recipient_id, current_user["id"]))
        match_row = c.fetchone()
        conn.close()
        
        if not match_row:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be mutually connected B2B matches to exchange messages."
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

from app.core.db import get_conn

class MatchActionRequest(BaseModel):
    action: str

@router.put("/users/matches/{match_id}/action")
def update_match_status(
    match_id: int,
    data: MatchActionRequest,
    current_user: dict = Depends(auth.get_current_user)
):
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM matches WHERE id = %s", (match_id,))
    match_row = c.fetchone()
    
    if not match_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Match record not found")
        
    match_data = dict(match_row)
    user_id = current_user["id"]
    
    if user_id != match_data["user_id_1"] and user_id != match_data["user_id_2"]:
        conn.close()
        raise HTTPException(status_code=403, detail="You are not a participant in this match")
        
    current_status = match_data["status"]
    new_status = current_status
    
    if data.action == "reject":
        new_status = "rejected"
    elif data.action == "convert":
        new_status = "converted"
    elif data.action == "accept":
        if match_data["user_id_1"] == user_id:
            if current_status == "pending":
                new_status = "accepted_1"
            elif current_status == "accepted_2":
                new_status = "connected"
        else: # user_id_2
            if current_status == "pending":
                new_status = "accepted_2"
            elif current_status == "accepted_1":
                new_status = "connected"
                
    c.execute("""
        UPDATE matches
        SET status = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """, (new_status, match_id))
    conn.commit()
    
    # If match connected, auto-generate B2B intro conversation thread!
    if new_status == "connected" and current_status != "connected":
        partner_id = match_data["user_id_2"] if match_data["user_id_1"] == user_id else match_data["user_id_1"]
        c.execute("SELECT first_name, last_name, company_name, intent FROM users WHERE id = %s", (partner_id,))
        partner_info = c.fetchone()
        
        if partner_info:
            p_name = f"{partner_info['first_name']} {partner_info['last_name']}"
            p_comp = partner_info['company_name'] or "their company"
            p_intent = partner_info['intent'] or ""
            
            u_name = f"{current_user['first_name']} {current_user['last_name']}"
            u_intent = current_user.get("intent") or ""
            
            intro_body = (
                f"Hi {current_user['first_name']}! We've just matched on SmallCircles ({match_data['score']}% compatibility).\n\n"
                f"Here are our complementary goals:\n"
                f"• My goal ({p_comp}): \"{p_intent}\"\n"
                f"• Your goal: \"{u_intent}\"\n\n"
                f"Matching Explanation:\n{match_data['match_reason']}\n\n"
                f"Let's connect and see how we can work together!"
            )
            
            message_repo.create_message(
                sender_id=partner_id,
                recipient_id=user_id,
                subject="B2B Goal Connection Match!",
                body=intro_body
            )
            
    conn.close()
    return {"status": new_status}


def sync_user_intent_summary(user_id: int):
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT ui.type, s.name as sub_industry_name, ui.intention
        FROM user_intents ui
        JOIN sub_industries s ON ui.sub_industry_id = s.id
        WHERE ui.user_id = %s
        ORDER BY ui.created_at ASC
    """, (user_id,))
    rows = c.fetchall()
    
    if not rows:
        summary = ""
    else:
        parts = []
        for r in rows:
            intent_type = "Seeking (Buy)" if r["type"] == "buy" else "Offering (Give)"
            parts.append(f"[{intent_type} in {r['sub_industry_name']}]: {r['intention']}")
        summary = " | ".join(parts)
        
    c.execute("UPDATE users SET intent = %s WHERE id = %s", (summary, user_id))
    conn.commit()
    conn.close()


@router.get("/users/profile/intents", response_model=List[UserIntentSchema])
def get_user_intents(current_user: dict = Depends(auth.get_current_user)):
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT ui.id, ui.industry_id, i.name as industry_name, 
               ui.sub_industry_id, s.name as sub_industry_name, 
               ui.type, ui.intention
        FROM user_intents ui
        JOIN industries i ON ui.industry_id = i.id
        JOIN sub_industries s ON ui.sub_industry_id = s.id
        WHERE ui.user_id = %s
        ORDER BY ui.created_at DESC
    """, (current_user["id"],))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/users/profile/intents", response_model=UserIntentSchema)
def add_user_intent(data: UserIntentCreate, current_user: dict = Depends(auth.get_current_user)):
    conn = get_conn()
    c = conn.cursor()
    
    try:
        industry_id = data.industry_id
        sub_industry_id = data.sub_industry_id
        
        # 1. Resolve Industry if name provided
        if (not industry_id or industry_id == 0) and data.industry_name:
            ind_name = data.industry_name.strip()
            c.execute("SELECT id FROM industries WHERE LOWER(name) = LOWER(%s)", (ind_name,))
            row = c.fetchone()
            if row:
                industry_id = row["id"]
            else:
                c.execute("INSERT INTO industries (name) VALUES (%s) RETURNING id", (ind_name,))
                industry_id = c.fetchone()["id"]
                
        # 2. Resolve Sub-Industry if name provided
        if (not sub_industry_id or sub_industry_id == 0) and data.sub_industry_name:
            sub_name = data.sub_industry_name.strip()
            c.execute("SELECT id FROM sub_industries WHERE LOWER(name) = LOWER(%s)", (sub_name,))
            row = c.fetchone()
            if row:
                sub_industry_id = row["id"]
            else:
                c.execute("INSERT INTO sub_industries (name) VALUES (%s) RETURNING id", (sub_name,))
                sub_industry_id = c.fetchone()["id"]
                
        if not industry_id or not sub_industry_id:
            raise HTTPException(status_code=400, detail="Industry and Sub-Industry must be specified or created.")
            
        # 3. Ensure linkage
        c.execute("""
            INSERT INTO industry_sub_industries (industry_id, sub_industry_id) 
            VALUES (%s, %s) ON CONFLICT DO NOTHING
        """, (industry_id, sub_industry_id))
        
        # 4. Insert Intent
        c.execute("""
            INSERT INTO user_intents (user_id, industry_id, sub_industry_id, type, intention)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (current_user["id"], industry_id, sub_industry_id, data.type, data.intention.strip()))
        
        intent_id = c.fetchone()["id"]
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        conn.close()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    conn.close()
    
    # Sync the legacy user profile intent summary
    sync_user_intent_summary(current_user["id"])
    
    # Return the newly created intent details
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT ui.id, ui.industry_id, i.name as industry_name, 
               ui.sub_industry_id, s.name as sub_industry_name, 
               ui.type, ui.intention
        FROM user_intents ui
        JOIN industries i ON ui.industry_id = i.id
        JOIN sub_industries s ON ui.sub_industry_id = s.id
        WHERE ui.id = %s
    """, (intent_id,))
    new_intent = c.fetchone()
    conn.close()
    return dict(new_intent)

@router.delete("/users/profile/intents/{intent_id}")
def delete_user_intent(intent_id: int, current_user: dict = Depends(auth.get_current_user)):
    conn = get_conn()
    c = conn.cursor()
    c.execute("DELETE FROM user_intents WHERE id = %s AND user_id = %s", (intent_id, current_user["id"]))
    conn.commit()
    conn.close()
    
    # Sync the legacy user profile intent summary
    sync_user_intent_summary(current_user["id"])
    return {"message": "Intent deleted successfully"}
