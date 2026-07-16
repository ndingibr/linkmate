import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword, resetPassword } from "./api";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function ForgotPassword() {
  const navigate = useNavigate();

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
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Reset failed. The code may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fffcf9", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <Header />

      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "60px 0" }}>
        <div className="login-split-container">
          {/* LEFT COLUMN: BANNER */}
          <div className="login-left-banner book-hero-content">
            <span className="book-genre" style={{ color: "#f17c13", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              Secure Recovery
            </span>
            <h1 style={{ color: "#111827", fontSize: "2.4rem", fontWeight: "800", lineHeight: "1.2", margin: "0 0 1rem 0" }}>
              {showOtpScreen ? "Enter your verification code." : "Recover your account."}
            </h1>
            <p
              className="book-description"
              style={{
                fontSize: "1.05rem",
                color: "#4b5563",
                lineHeight: "1.6",
                margin: "0 0 2.5rem 0",
                maxWidth: "500px",
              }}
            >
              {showOtpScreen 
                ? "Please check your inbox. Enter the 6-digit verification code along with your new password below."
                : "Enter your email address, and we'll dispatch a secure, 6-digit verification code to reset your account password."
              }
            </p>

            {/* Inline Graphic Card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
                background: "#ffffff",
                padding: "1.25rem 1.5rem",
                borderRadius: "16px",
                border: "1px solid #f3e8df",
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                maxWidth: "500px",
                boxSizing: "border-box",
              }}
            >
              <div style={{
                backgroundColor: "rgba(241, 124, 19, 0.08)",
                borderRadius: "12px",
                padding: "12px",
                color: "#f17c13",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <ShieldCheck size={28} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "#111827" }}>
                  Robust Security Protocols
                </h4>
                <p
                  style={{
                    margin: "0.25rem 0 0 0",
                    fontSize: "0.85rem",
                    color: "#4b5563",
                    lineHeight: "1.4",
                  }}
                >
                  We verify One-Time Passwords (OTP) on our backend using tight expiry windows to ensure absolute safety.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: RECOVERY FORM CARD */}
          <div className="login-right-form">
            <div className="form-card-premium">
              <h2
                style={{
                  fontSize: "1.75rem",
                  fontWeight: "800",
                  color: "#111827",
                  margin: "0 0 0.5rem 0",
                }}
              >
                {showOtpScreen ? "Verify Reset Code" : "Forgot Password?"}
              </h2>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: "0.9rem",
                  margin: "0 0 2rem 0",
                }}
              >
                {showOtpScreen 
                  ? "Enter the 6-digit code and choose a new password." 
                  : "We'll send verification code instructions directly to you."
                }
              </p>

              {error && (
                <div className="alert-error-premium">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="alert-success-premium" style={{
                  backgroundColor: "#ecfdf5",
                  color: "#065f46",
                  border: "1px solid #a7f3d0",
                  borderRadius: "12px",
                  padding: "0.75rem 1rem",
                  marginBottom: "1.5rem",
                  fontSize: "0.85rem",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}>
                  <span>✅</span>
                  <span>{successMessage}</span>
                </div>
              )}

              {!showOtpScreen ? (
                /* FORGOT PASSWORD REQUEST FORM (STEP 1) */
                <form onSubmit={handleForgotSubmit}>
                  <div className="input-group-premium" style={{ marginBottom: "1.75rem" }}>
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
                    style={{
                      background: "linear-gradient(135deg, #f17c13 0%, #d96a0a 100%)",
                      color: "#ffffff",
                      padding: "0.875rem",
                      borderRadius: "12px",
                      fontWeight: "700",
                      fontSize: "0.9rem",
                      width: "100%",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(241, 124, 19, 0.2)",
                      transition: "all 0.2s ease",
                      marginBottom: "1.5rem"
                    }}
                  >
                    {loading ? "Sending OTP..." : "Send Verification Code"}
                  </button>
                </form>
              ) : (
                /* RESET PASSWORD CONFIRM FORM (STEP 2) */
                <form onSubmit={handleResetSubmit}>
                  <div className="input-group-premium">
                    <label className="input-label-premium">Email Address</label>
                    <input
                      type="email"
                      className="input-premium"
                      value={email}
                      disabled
                      style={{ backgroundColor: "#fafafa", cursor: "not-allowed" }}
                    />
                  </div>

                  <div className="input-group-premium">
                    <label className="input-label-premium">6-Digit Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      className="input-premium"
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      style={{ letterSpacing: "0.25em", textAlign: "center", fontSize: "1.1rem", fontWeight: "800" }}
                      required
                    />
                  </div>

                  <div className="input-group-premium">
                    <label className="input-label-premium">New Password</label>
                    <input
                      type="password"
                      className="input-premium"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group-premium" style={{ marginBottom: "1.75rem" }}>
                    <label className="input-label-premium">Confirm Password</label>
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
                    style={{
                      background: "linear-gradient(135deg, #f17c13 0%, #d96a0a 100%)",
                      color: "#ffffff",
                      padding: "0.875rem",
                      borderRadius: "12px",
                      fontWeight: "700",
                      fontSize: "0.9rem",
                      width: "100%",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(241, 124, 19, 0.2)",
                      transition: "all 0.2s ease",
                      marginBottom: "1.5rem"
                    }}
                  >
                    {loading ? "Saving Password..." : "Save Password"}
                  </button>
                </form>
              )}

              <div 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: "0.25rem",
                  fontSize: "0.85rem",
                  color: "#6b7280",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "color 0.15s"
                }}
                onClick={() => {
                  if (showOtpScreen) {
                    setShowOtpScreen(false);
                    setError("");
                    setSuccessMessage("");
                  } else {
                    navigate("/login");
                  }
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#f17c13"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#6b7280"}
              >
                <ArrowLeft size={16} />
                {showOtpScreen ? "Change Email" : "Back to Sign In"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
