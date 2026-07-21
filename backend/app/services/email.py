import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = "cp74.domains.co.za"
SMTP_PORT = 465
SMTP_USER = "admin@linkmate.co.za"
SMTP_PASS = "#Doreen001"

def send_activation_email(to_email: str, first_name: str):
    activation_link = f"http://localhost:5173/signin?activate_email={to_email}"
    
    # Create message container
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "Activate your Small Circles Matchmaking Account"
    msg['From'] = f"Small Circles <{SMTP_USER}>"
    msg['To'] = to_email

    # Plain text version for compatibility
    text = f"""Hi {first_name},

Thank you for creating an account on Small Circles. We utilise your intention to help you build the right network of business friends around your goals.

To complete your registration and start discovering matches, please confirm your email address:

Confirm & Activate Intention: {activation_link}

Once confirmed, you will be taken to your dashboard to register your first active intent.

Note: We strictly reject spam and low-quality alerts. If we don't identify any business friends matching your profile, we won't clutter your inbox.
"""

    # HTML version with Small Circles branding and static image logo
    html = f"""<html>
      <body style="font-family: 'Outfit', 'Inter', -apple-system, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px; color: #1f2937;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #ffffff; border-bottom: 3px solid #f17c13; padding: 24px 32px; text-align: left;">
            <span style="font-family: 'Outfit', 'Inter', -apple-system, sans-serif; font-weight: 800; font-size: 22px; letter-spacing: -0.02em; color: #1f2937;">
              small<span style="color: #f17c13;">circles</span>
            </span>
          </div>
          <div style="padding: 32px; line-height: 1.6; font-size: 15px;">
            <p style="font-weight: 600; margin-top: 0; font-size: 16px;">Hi {first_name},</p>
            <p>
              Thank you for creating an account on <strong>Small Circles</strong>. We utilise your intention to help you build the right network of business friends around your goals.
            </p>
            <p>
              To complete your registration and start discovering matches, please confirm your email address:
            </p>
            <div style="margin: 30px 0; text-align: left;">
              <a href="{activation_link}" style="background-color: #f17c13; color: #ffffff; padding: 12px 28px; border-radius: 30px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 10px rgba(241, 124, 19, 0.25);">
                Confirm & Activate Intention
              </a>
            </div>
            <p style="font-size: 13px; color: #6b7280; margin-bottom: 24px;">
              Once confirmed, you will be taken to your dashboard to register your first active intent.
            </p>
            <div style="margin: 24px 0; border-top: 1px dashed #e5e7eb;"></div>
            <p style="font-size: 12px; color: #9ca3af; font-style: italic; margin: 0;">
              Note: We strictly reject spam and low-quality alerts. If we don't identify any high-probability business friends matching your profile, we promise not to send updates.
            </p>
          </div>
        </div>
      </body>
    </html>"""

    msg.attach(MIMEText(text, 'plain'))
    msg.attach(MIMEText(html, 'html'))

    # Send email and log status in repo
    from app.repositories import email_repo
    try:
        server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10)
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [to_email, "ndingibr@gmail.com"], msg.as_string())
        server.quit()
        # Log successful dispatch
        email_repo.log_sent_email(to_email, msg['Subject'], html, "sent")
    except Exception as e:
        # Log failed dispatch
        email_repo.log_sent_email(to_email, msg['Subject'], html, "failed", str(e))
        raise e

def send_direct_message_email(
    to_email: str,
    recipient_name: str,
    sender_name: str,
    sender_company: str,
    message_subject: str,
    message_body: str
):
    subject = f"New Small Circles Message: {message_subject}"
    
    # Create message container
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f"Small Circles <{SMTP_USER}>"
    msg['To'] = to_email

    sender_info = f"{sender_name} from {sender_company}" if sender_company else sender_name

    text = f"""Hi {recipient_name},

You have received a new message on Small Circles from {sender_info}.

Subject: {message_subject}

Message:
----------------------------------------
{message_body}
----------------------------------------

To read or reply to this message, please log in to your Small Circles dashboard:
http://localhost:5173/profile

Regards,
Small Circles Team
"""

    html = f"""<html>
      <body style="font-family: 'Outfit', 'Inter', -apple-system, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px; color: #1f2937;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #ffffff; border-bottom: 3px solid #f17c13; padding: 24px 32px; text-align: left;">
            <span style="font-family: 'Outfit', 'Inter', -apple-system, sans-serif; font-weight: 800; font-size: 22px; letter-spacing: -0.02em; color: #1f2937;">
              small<span style="color: #f17c13;">circles</span>
            </span>
          </div>
          <div style="padding: 32px; line-height: 1.6; font-size: 15px;">
            <p style="font-weight: 600; margin-top: 0; font-size: 16px;">Hi {recipient_name},</p>
            <p>
              You have received a new message on Small Circles from <strong>{sender_info}</strong>.
            </p>
            
            <div style="background-color: #f9fafb; border-left: 4px solid #f17c13; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #111827;">Subject: {message_subject}</p>
              <p style="margin: 0; color: #4b5563; white-space: pre-line;">{message_body}</p>
            </div>
            
            <div style="margin: 30px 0; text-align: left;">
              <a href="http://localhost:5173/profile" style="background-color: #f17c13; color: #ffffff; padding: 12px 28px; border-radius: 30px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 10px rgba(241, 124, 19, 0.25);">
                Reply on Small Circles
              </a>
            </div>
            
            <div style="margin: 24px 0; border-top: 1px dashed #e5e7eb;"></div>
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              This is an automated notification. To change your communication settings, update your profile options.
            </p>
          </div>
        </div>
      </body>
    </html>"""

    msg.attach(MIMEText(text, 'plain'))
    msg.attach(MIMEText(html, 'html'))

    from app.repositories import email_repo
    try:
        server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10)
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [to_email, "ndingibr@gmail.com"], msg.as_string())
        server.quit()
        email_repo.log_sent_email(to_email, subject, html, "sent")
    except Exception as e:
        email_repo.log_sent_email(to_email, subject, html, "failed", str(e))
        print(f"SMTP send failed for message notification: {e}")


def send_password_reset_email(to_email: str, first_name: str, token: str):
    reset_link = f"http://localhost:5173/forgot-password?token={token}"
    
    # Create message container
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "Reset your Small Circles Account Password"
    msg['From'] = f"Small Circles <{SMTP_USER}>"
    msg['To'] = to_email

    # Plain text version for compatibility
    text = f"""Hi {first_name},

We received a request to reset your Small Circles account password.

To reset your password, please click the link below:

Reset Password: {reset_link}

If you did not request a password reset, please ignore this email.

Regards,
Small Circles Team
"""

    # HTML version with Small Circles branding and static image logo
    html = f"""<html>
      <body style="font-family: 'Outfit', 'Inter', -apple-system, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px; color: #1f2937;">
        <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          <div style="background-color: #ffffff; border-bottom: 3px solid #f17c13; padding: 24px 32px; text-align: left;">
            <span style="font-family: 'Outfit', 'Inter', -apple-system, sans-serif; font-weight: 800; font-size: 22px; letter-spacing: -0.02em; color: #1f2937;">
              small<span style="color: #f17c13;">circles</span>
            </span>
          </div>
          <div style="padding: 32px; line-height: 1.6; font-size: 15px;">
            <p style="font-weight: 600; margin-top: 0; font-size: 16px;">Hi {first_name},</p>
            <p>
              We received a request to reset your <strong>Small Circles</strong> account password.
            </p>
            <p>
              To reset your password, please click the button below:
            </p>
            <div style="margin: 30px 0; text-align: left;">
              <a href="{reset_link}" style="background-color: #f17c13; color: #ffffff; padding: 12px 28px; border-radius: 30px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 10px rgba(241, 124, 19, 0.25);">
                Reset Password
              </a>
            </div>
            <p style="font-size: 13px; color: #6b7280; margin-bottom: 24px;">
              If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
            <div style="margin: 24px 0; border-top: 1px dashed #e5e7eb;"></div>
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              This is an automated message. Please do not reply directly.
            </p>
          </div>
        </div>
      </body>
    </html>"""

    msg.attach(MIMEText(text, 'plain'))
    msg.attach(MIMEText(html, 'html'))

    from app.repositories import email_repo
    try:
        server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10)
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [to_email, "ndingibr@gmail.com"], msg.as_string())
        server.quit()
        email_repo.log_sent_email(to_email, msg['Subject'], html, "sent")
    except Exception as e:
        email_repo.log_sent_email(to_email, msg['Subject'], html, "failed", str(e))
        raise e


def send_activation_otp_email(to_email: str, first_name: str, otp_code: str):
    # Create message container
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"{otp_code} is your Small Circles Verification Code"
    msg['From'] = f"Small Circles <{SMTP_USER}>"
    msg['To'] = to_email

    # Plain text version
    text = f"""Hi {first_name},

Thank you for creating an account on Small Circles.

Please verify your email address using the following 6-digit One-Time Password (OTP):

Verification Code: {otp_code}

This code is valid for 15 minutes. Once verified, your account will be activated.

Regards,
Small Circles Team
"""

    # HTML version with Small Circles branding and static image logo
    html = f"""<html>
      <body style="font-family: 'Outfit', 'Inter', -apple-system, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 20px; color: #1f2937; -webkit-font-smoothing: antialiased;">
        
        <!-- Centered Brand Header Logo -->
        <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
          <tr>
            <td style="padding-right: 10px; vertical-align: middle;">
              <img src="https://linkmate.fly.dev/logo_rings.png" alt="Small Circles Logo" width="34" height="34" style="display: block; border: 0; outline: none; text-decoration: none;" />
            </td>
            <td style="vertical-align: middle; text-align: left; line-height: 1.05;">
              <span style="font-family: 'Outfit', 'Inter', -apple-system, sans-serif; font-weight: 700; font-size: 18px; letter-spacing: -0.02em; color: #35453f; text-transform: lowercase; display: inline-block;">
                small<br />circles
              </span>
            </td>
          </tr>
        </table>

        <!-- Premium Transactional White Card -->
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px 30px; text-align: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); box-sizing: border-box;">
          
          <h2 style="font-family: 'Outfit', 'Inter', -apple-system, sans-serif; font-size: 24px; font-weight: 700; color: #35453f; margin: 0 0 16px 0; letter-spacing: -0.01em;">
            Here's Your Verification Code
          </h2>
          
          <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; line-height: 1.5; color: #4b5563; margin: 0 0 30px 0; font-weight: 500;">
            Copy the code, and then enter it to verify your email address.<br />
            The code expires in 15 minutes.
          </p>

          <div style="font-family: 'Outfit', 'Inter', -apple-system, sans-serif; font-size: 42px; font-weight: 800; color: #ec5e3b; letter-spacing: 0.05em; margin: 30px 0; line-height: 1;">
            {otp_code}
          </div>

          <div style="border-top: 1px solid #f3f4f6; margin: 30px 0 20px 0;"></div>

          <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; color: #9ca3af; margin: 0; font-weight: 500;">
            If you haven't requested this email, you can safely ignore it.
          </p>

        </div>

        <!-- Footer Copyright -->
        <div style="text-align: center; margin-top: 24px; font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; color: #9ca3af; line-height: 1.5;">
          © 2026 Small Circles. All rights reserved.<br />
          Various trademarks held by their respective owners.
        </div>

      </body>
    </html>"""

    msg.attach(MIMEText(text, 'plain'))
    msg.attach(MIMEText(html, 'html'))

    from app.repositories import email_repo
    try:
        server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10)
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [to_email, "ndingibr@gmail.com"], msg.as_string())
        server.quit()
        email_repo.log_sent_email(to_email, msg['Subject'], html, "sent")
    except Exception as e:
        email_repo.log_sent_email(to_email, msg['Subject'], html, "failed", str(e))
        raise e


def send_password_reset_otp_email(to_email: str, first_name: str, otp_code: str):
    # Create message container
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"{otp_code} is your Small Circles Password Reset Code"
    msg['From'] = f"Small Circles <{SMTP_USER}>"
    msg['To'] = to_email

    # Plain text version
    text = f"""Hi {first_name},

We received a request to reset your Small Circles account password.

Please verify this request using the following 6-digit One-Time Password (OTP):

Password Reset Code: {otp_code}

This code is valid for 15 minutes. If you did not request a password reset, you can safely ignore this email.

Regards,
Small Circles Team
"""

    # HTML version with Small Circles branding and static image logo
    html = f"""<html>
      <body style="font-family: 'Outfit', 'Inter', -apple-system, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 20px; color: #1f2937; -webkit-font-smoothing: antialiased;">
        
        <!-- Centered Brand Header Logo -->
        <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
          <tr>
            <td style="padding-right: 10px; vertical-align: middle;">
              <img src="https://linkmate.fly.dev/logo_rings.png" alt="Small Circles Logo" width="34" height="34" style="display: block; border: 0; outline: none; text-decoration: none;" />
            </td>
            <td style="vertical-align: middle; text-align: left; line-height: 1.05;">
              <span style="font-family: 'Outfit', 'Inter', -apple-system, sans-serif; font-weight: 700; font-size: 18px; letter-spacing: -0.02em; color: #35453f; text-transform: lowercase; display: inline-block;">
                small<br />circles
              </span>
            </td>
          </tr>
        </table>

        <!-- Premium Transactional White Card -->
        <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px 30px; text-align: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); box-sizing: border-box;">
          
          <h2 style="font-family: 'Outfit', 'Inter', -apple-system, sans-serif; font-size: 24px; font-weight: 700; color: #35453f; margin: 0 0 16px 0; letter-spacing: -0.01em;">
            Here's Your Verification Code
          </h2>
          
          <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 14px; line-height: 1.5; color: #4b5563; margin: 0 0 30px 0; font-weight: 500;">
            Copy the code, and then enter it to reset your password.<br />
            The code expires in 15 minutes.
          </p>

          <div style="font-family: 'Outfit', 'Inter', -apple-system, sans-serif; font-size: 42px; font-weight: 800; color: #ec5e3b; letter-spacing: 0.05em; margin: 30px 0; line-height: 1;">
            {otp_code}
          </div>

          <div style="border-top: 1px solid #f3f4f6; margin: 30px 0 20px 0;"></div>

          <p style="font-family: 'Inter', -apple-system, sans-serif; font-size: 12px; color: #9ca3af; margin: 0; font-weight: 500;">
            If you haven't requested this email, you can safely ignore it.
          </p>

        </div>

        <!-- Footer Copyright -->
        <div style="text-align: center; margin-top: 24px; font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; color: #9ca3af; line-height: 1.5;">
          © 2026 Small Circles. All rights reserved.<br />
          Various trademarks held by their respective owners.
        </div>

      </body>
    </html>"""

    msg.attach(MIMEText(text, 'plain'))
    msg.attach(MIMEText(html, 'html'))

    from app.repositories import email_repo
    try:
        server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10)
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [to_email, "ndingibr@gmail.com"], msg.as_string())
        server.quit()
        email_repo.log_sent_email(to_email, msg['Subject'], html, "sent")
    except Exception as e:
        email_repo.log_sent_email(to_email, msg['Subject'], html, "failed", str(e))
        raise e

def send_match_summary_email(to_email: str, new_matches: list, rejected_matches: list, connected_matches: list):
    """
    Sends a consolidated transaction summary of matchmaking status changes (new, rejected, connected)
    detected by state-comparison during the matching scheduler cycle.
    """
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "Small Circles - B2B Matchmaking Audit Summary Alert"
    msg['From'] = f"Small Circles Audit <{SMTP_USER}>"
    msg['To'] = to_email

    # Plain text summary
    text = f"""Small Circles B2B Matchmaking Audit Summary:
    
- New Matches: {len(new_matches)}
- Connected Matches: {len(connected_matches)}
- Rejected Matches: {len(rejected_matches)}

Check your audit history for detailed intention synergy logs.
"""

    # Generate HTML Table for New Matches
    new_matches_html = ""
    if new_matches:
        new_matches_html = """
        <h3 style="font-family: 'Outfit', sans-serif; color: #35453f; border-bottom: 2px solid #ec5e3b; padding-bottom: 6px; margin-top: 24px;">🔥 New Matches Discovered ({count})</h3>
        <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse: collapse; margin-top: 10px; font-size: 13px;">
          <thead>
            <tr style="background-color: #fcf8f2; text-align: left; border-bottom: 2px solid #eddcd2;">
              <th style="font-family: 'Outfit', sans-serif; font-weight: 700; color: #35453f; width: 60px;">ID / %</th>
              <th style="font-family: 'Outfit', sans-serif; font-weight: 700; color: #35453f;">Segment</th>
              <th style="font-family: 'Outfit', sans-serif; font-weight: 700; color: #35453f;">User A (Offer/Need)</th>
              <th style="font-family: 'Outfit', sans-serif; font-weight: 700; color: #35453f;">User B (Offer/Need)</th>
              <th style="font-family: 'Outfit', sans-serif; font-weight: 700; color: #35453f;">AI Synergy Synergy Reason</th>
            </tr>
          </thead>
          <tbody>
        """.replace("{count}", str(len(new_matches)))
        
        for idx, m in enumerate(new_matches):
            bg = "#ffffff" if idx % 2 == 0 else "#fafafa"
            new_matches_html += f"""
            <tr style="background-color: {bg}; border-bottom: 1px solid #f3f4f6;">
              <td style="font-weight: 700; color: #ec5e3b; vertical-align: top;">
                #{m.get('match_id')}<br/>
                <span style="font-size: 14px; color: #10b981;">{m.get('match_percentage_formatted')}</span>
              </td>
              <td style="color: #6b7280; vertical-align: top;">
                <strong>{m.get('industry')}</strong><br/>
                <span style="font-size: 11px;">{m.get('sub_industry')}</span>
              </td>
              <td style="vertical-align: top; line-height: 1.4;">
                <strong>{m.get('user_1_name')}</strong><br/>
                <span style="font-size: 11px; color: #9ca3af;">{m.get('user_1_company')}</span><br/>
                <span style="font-style: italic; font-size: 12px; color: #4b5563;">"{m.get('user_1_intention')}"</span>
              </td>
              <td style="vertical-align: top; line-height: 1.4;">
                <strong>{m.get('user_2_name')}</strong><br/>
                <span style="font-size: 11px; color: #9ca3af;">{m.get('user_2_company')}</span><br/>
                <span style="font-style: italic; font-size: 12px; color: #4b5563;">"{m.get('user_2_intention')}"</span>
              </td>
              <td style="vertical-align: top; color: #4b5563; font-size: 12px; line-height: 1.4;">
                {m.get('ai_synergy_reason')}
              </td>
            </tr>
            """
        new_matches_html += "</tbody></table>"

    # Generate lists for state changes
    connected_html = ""
    if connected_matches:
        connected_html = f"""
        <h3 style="font-family: 'Outfit', sans-serif; color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 6px; margin-top: 24px;">🤝 Matches Connected ({len(connected_matches)})</h3>
        <ul style="padding-left: 20px; font-size: 13px; color: #374151; line-height: 1.6;">
        """
        for m in connected_matches:
            connected_html += f"<li><strong>Match #{m['match_id']}</strong> ({m['match_percentage']}%): <strong>{m['user_1_name']}</strong> ({m['user_1_company']}) accepted connection with <strong>{m['user_2_name']}</strong> ({m['user_2_company']})</li>"
        connected_html += "</ul>"

    rejected_html = ""
    if rejected_matches:
        rejected_html = f"""
        <h3 style="font-family: 'Outfit', sans-serif; color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 6px; margin-top: 24px;">❌ Matches Rejected ({len(rejected_matches)})</h3>
        <ul style="padding-left: 20px; font-size: 13px; color: #374151; line-height: 1.6;">
        """
        for m in rejected_matches:
            rejected_html += f"<li><strong>Match #{m['match_id']}</strong> ({m['match_percentage']}%): Intention link between <strong>{m['user_1_name']}</strong> and <strong>{m['user_2_name']}</strong> was rejected.</li>"
        rejected_html += "</ul>"

    no_changes_html = ""
    if not new_matches and not rejected_matches and not connected_matches:
        no_changes_html = """
        <div style="background-color: #f9fafb; border: 1px dashed #d1d5db; border-radius: 8px; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
          💤 No matchmaking state transitions occurred during this 30-minute interval.
        </div>
        """

    # Complete HTML email structure
    html = f"""<html>
      <body style="font-family: 'Inter', -apple-system, sans-serif; background-color: #fafbfc; margin: 0; padding: 40px 20px; color: #1f2937;">
        <div style="max-width: 900px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Logo block -->
          <div style="background-color: #ffffff; border-bottom: 3px solid #f17c13; padding: 24px 32px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: inline-flex; align-items: center;">
              <img src="https://linkmate.fly.dev/logo_rings.png" alt="Small Circles Logo" width="30" height="30" style="margin-right: 8px; vertical-align: middle;" />
              <span style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 20px; letter-spacing: -0.02em; color: #35453f; text-transform: lowercase; line-height: 1;">
                small<br/><span style="color: #b0a296; font-size: 18px;">circles</span>
              </span>
            </div>
            <div style="font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">
              Audit Notification Digest
            </div>
          </div>
          
          <!-- Body Content -->
          <div style="padding: 32px; line-height: 1.6;">
            <h2 style="font-family: 'Outfit', sans-serif; margin-top: 0; color: #35453f; font-size: 20px; font-weight: 700;">Matchmaking Cycle Results Summary</h2>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">
              The B2B matchmaking engine executed. Here is the summary of state changes detected by comparing the current state of active matches with the previous logged snapshot.
            </p>
            
            <!-- Statistics Row -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
              <div style="background-color: #fef8f3; border: 1px solid #fbdcbd; border-radius: 8px; padding: 16px; text-align: center;">
                <span style="display: block; font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; color: #ec5e3b;">{len(new_matches)}</span>
                <span style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">New Matches</span>
              </div>
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center;">
                <span style="display: block; font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; color: #166534;">{len(connected_matches)}</span>
                <span style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Connected</span>
              </div>
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; text-align: center;">
                <span style="display: block; font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; color: #991b1b;">{len(rejected_matches)}</span>
                <span style="font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Rejected</span>
              </div>
            </div>

            <!-- Dynamic Tables -->
            {no_changes_html}
            {new_matches_html}
            {connected_html}
            {rejected_html}
            
          </div>
          
          <!-- Footer Copyright -->
          <div style="background-color: #fafbfc; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center; font-size: 11px; color: #9ca3af;">
            © 2026 Small Circles. Confidential Audit Log Notification.
          </div>
          
        </div>
      </body>
    </html>"""

    msg.attach(MIMEText(text, 'plain'))
    msg.attach(MIMEText(html, 'html'))

    from app.repositories import email_repo
    try:
        server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10)
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [to_email], msg.as_string())
        server.quit()
        email_repo.log_sent_email(to_email, msg['Subject'], html, "sent")
    except Exception as e:
        email_repo.log_sent_email(to_email, msg['Subject'], html, "failed", str(e))
        raise e


