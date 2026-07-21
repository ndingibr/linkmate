import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { forgotPassword, resetPassword } from "./api";
import Footer from "./components/Footer";
import imgThreeProfessionals from "./img/three_professionals.png";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // Step state
  const [showOtpScreen, setShowOtpScreen] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setSuccessMessage(res?.message || "If an account matches that email, a 6-digit verification code has been sent.");
      setShowOtpScreen(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Request failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ email, otp_code: otpCode, password });
      setSuccessMessage(res?.message || "Password reset successful! You can now log in.");
      setPassword("");
      setConfirmPassword("");
      setOtpCode("");
      setTimeout(() => {
        navigate("/signin");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Reset failed. The code may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-page-wrapper" style={{ backgroundColor: "#eef1f6", minHeight: "100vh", display: "flex", flexDirection: "column", padding: "40px 0" }}>

      {/* TOP HEADER ROW: LOGO & ALREADY A MEMBER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        maxWidth: "1060px",
        margin: "0 auto 2.5rem auto",
        padding: "0 24px",
        boxSizing: "border-box"
      }}>
        {/* Official Brand Logo Block */}
        <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => navigate("/")}>
          <svg width="34" height="34" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: "10px", flexShrink: 0 }}>
            <circle cx="25" cy="18" r="11" stroke="#b0a296" strokeWidth="3" fill="none" />
            <circle cx="17" cy="31" r="11" stroke="#b0a296" strokeWidth="3" fill="none" />
            <circle cx="33" cy="31" r="11" stroke="#b0a296" strokeWidth="3" fill="none" />
          </svg>
          <span style={{
            color: "#35453f",
            fontSize: "1.2rem",
            fontWeight: "700",
            lineHeight: "1.05",
            letterSpacing: "-0.02em",
            fontFamily: "inherit",
            textTransform: "lowercase",
            textAlign: "left"
          }}>
            small<br />circles
          </span>
        </div>

        <div style={{ fontSize: "0.9rem", color: "#4b5563", fontWeight: "500" }}>
          Remember your password? <span style={{ color: "#ec5e3b", cursor: "pointer", fontWeight: "700" }} onClick={() => navigate("/signin")}>Sign In</span>
        </div>
      </div>

      <div className="split-page-section" style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <div className="login-split-container" style={{ display: "flex", gap: "60px", flexWrap: "wrap", width: "100%", maxWidth: "1060px", margin: "0 auto", padding: "0 24px", boxSizing: "border-box", alignItems: "center" }}>
          
          {/* LEFT COLUMN: BRAND VALUE PROP */}
          <div className="login-left-banner circles-content" style={{ 
            flex: "1 1 450px", 
            color: "#35453f",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            
            {/* Standard Branding Pill Badge */}
            <span style={{
              color: "#4a5d5e",
              fontWeight: "700",
              fontSize: "0.78rem",
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 14px",
              borderRadius: "20px",
              backgroundColor: "rgba(160, 167, 171, 0.15)",
              border: "1px solid rgba(160, 167, 171, 0.3)",
              marginBottom: "1.2rem",
              width: "fit-content",
              letterSpacing: "0.02em"
            }}>
              Secure Recovery
            </span>
            <h1 className="left-banner-title" style={{
              color: "#35453f",
              fontSize: "2.5rem",
              fontWeight: "600",
              lineHeight: "1.2",
              margin: "0 0 1.2rem 0",
              letterSpacing: "-0.03em"
            }}>
              Recover your <br />
              partner <span style={{ color: "#ec5e3b" }}>circle access.</span>
            </h1>

            {/* Centered Single Circle Image Frame */}
            <div style={{
              position: "relative",
              width: "220px",
              height: "220px",
              margin: "0 auto 2rem auto",
              borderRadius: "50%",
              border: "3px solid rgba(176, 162, 150, 0.35)",
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 8px 24px rgba(38, 70, 58, 0.1)"
            }}>
              <img
                src={imgThreeProfessionals}
                alt="Three Professionals Partnership Connection"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block"
                }}
              />
            </div>

            <p style={{
              color: "#35453f",
              fontSize: "1.2rem",
              fontWeight: "700",
              lineHeight: "1.4",
              margin: "0 0 8px 0",
              letterSpacing: "-0.01em"
            }}>
              Small Circles keeps your credentials secure.
            </p>
            <p style={{
              color: "#4b5563",
              fontSize: "1rem",
              fontWeight: "500",
              lineHeight: "1.5",
              margin: "0 0 1.8rem 0"
            }}>
              We verify and reset access parameters securely using encrypted verification codes to guarantee privacy.
            </p>

            {/* Checklist items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0 0 1rem 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#35453f", fontSize: "0.95rem", fontWeight: "600" }}>
                <span style={{ color: "#ec5e3b", fontWeight: "bold", fontSize: "1.1rem" }}>✓</span> Encrypted Verification
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#35453f", fontSize: "0.95rem", fontWeight: "600" }}>
                <span style={{ color: "#ec5e3b", fontWeight: "bold", fontSize: "1.1rem" }}>✓</span> Strict Expiry Windows
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#35453f", fontSize: "0.95rem", fontWeight: "600" }}>
                <span style={{ color: "#ec5e3b", fontWeight: "bold", fontSize: "1.1rem" }}>✓</span> Private Recovery
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: RECOVERY CARD */}
          <div className="login-right-form" style={{ flex: "1 1 450px", display: "flex", justifyContent: "flex-end", width: "100%" }}>
            <div className="form-card-premium" style={{ 
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              padding: "2.5rem",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
              border: "1px solid #e5e7eb",
              width: "100%",
              boxSizing: "border-box",
              color: "#1f2937"
            }}>
              <div>
                <div className="form-card-header" style={{ marginBottom: "24px" }}>
                  <h3 className="form-card-header-title" style={{
                    color: "#35453f",
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    margin: "0 0 6px 0",
                    letterSpacing: "-0.01em"
                  }}>
                    {showOtpScreen ? "Verify Reset Code" : "Forgot Password?"}
                  </h3>
                  <p className="form-card-header-desc" style={{
                    color: "#6b7280",
                    fontSize: "0.9rem",
                    lineHeight: "1.4",
                    margin: 0
                  }}>
                    {showOtpScreen 
                      ? "Enter the 6-digit code and choose a new password." 
                      : "We'll send verification code instructions directly to you."
                    }
                  </p>
                </div>
                
                <hr style={{ border: "0", borderTop: "1px solid #e5e7eb", margin: "20px 0" }} />

                {error && (
                  <div className="alert-error-premium" style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fca5a5",
                    color: "#b91c1c",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    marginBottom: "20px"
                  }}>
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="alert-success-premium" style={{
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #86efac",
                    color: "#166534",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    marginBottom: "20px",
                    fontWeight: "500"
                  }}>
                    {successMessage}
                  </div>
                )}

                {!showOtpScreen ? (
                  <form onSubmit={handleForgotSubmit}>
                    <div className="input-group-premium mb-1-75">
                      <label className="input-label-premium">Email Address</label>
                      <input
                        type="email"
                        className="input-premium"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="form-submit-btn-premium"
                      style={{
                        background: "#ec5e3b",
                        color: "#ffffff",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: "24px",
                        fontWeight: "700",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(236, 94, 59, 0.15)",
                        transition: "all 0.2s ease",
                        width: "100%",
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px"
                      }}
                    >
                      {loading ? "Sending..." : "Send Verification Code"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetSubmit}>
                    <div className="input-group-premium" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="input-label-premium" style={{ color: "#374151", fontSize: "0.85rem", fontWeight: "600" }}>Email Address</label>
                      <input
                        type="email"
                        className="input-premium"
                        value={email}
                        disabled
                        style={{ backgroundColor: "#fafafa", cursor: "not-allowed" }}
                      />
                    </div>

                    <div className="input-group-premium" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="input-label-premium" style={{ color: "#374151", fontSize: "0.85rem", fontWeight: "600" }}>6-Digit Verification Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        className="input-premium otp-input-premium"
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        required
                      />
                    </div>

                    <div className="input-group-premium" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="input-label-premium" style={{ color: "#374151", fontSize: "0.85rem", fontWeight: "600" }}>New Password</label>
                      <input
                        type="password"
                        className="input-premium"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group-premium mb-1-75" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label className="input-label-premium" style={{ color: "#374151", fontSize: "0.85rem", fontWeight: "600" }}>Confirm Password</label>
                      <input
                        type="password"
                        className="input-premium"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="form-submit-btn-premium"
                      style={{
                        background: "#ec5e3b",
                        color: "#ffffff",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: "24px",
                        fontWeight: "700",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(236, 94, 59, 0.15)",
                        transition: "all 0.2s ease",
                        width: "100%",
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px"
                      }}
                    >
                      {loading ? "Saving Password..." : "Save Password"}
                    </button>
                  </form>
                )}

                {/* Under-button Checklist (Wireframe footer) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "20px", borderTop: "1px solid #f3f4f6", paddingTop: "15px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "0.82rem", fontWeight: "500" }}>
                    <span style={{ color: "#ec5e3b", fontWeight: "bold" }}>✓</span> Secure Recovery
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "0.82rem", fontWeight: "500" }}>
                    <span style={{ color: "#ec5e3b", fontWeight: "bold" }}>✓</span> 2-Step Verification
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "0.82rem", fontWeight: "500" }}>
                    <span style={{ color: "#ec5e3b", fontWeight: "bold" }}>✓</span> Automated Reset
                  </div>
                </div>

                <p className="login-switch-footer" style={{ 
                  textAlign: "center", 
                  marginTop: "24px", 
                  fontSize: "0.85rem",
                  color: "#6b7280"
                }}>
                  {showOtpScreen ? (
                    <span 
                      onClick={() => {
                        setShowOtpScreen(false);
                        setError("");
                        setSuccessMessage("");
                      }} 
                      style={{ color: "#ec5e3b", fontWeight: "700", cursor: "pointer" }}
                    >
                      Change Email or Back
                    </span>
                  ) : (
                    <>
                      Back to{" "}
                      <span 
                        onClick={() => navigate("/signin")} 
                        style={{ color: "#ec5e3b", fontWeight: "700", cursor: "pointer" }}
                      >
                        Sign In
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
