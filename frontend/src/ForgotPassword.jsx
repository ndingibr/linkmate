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

      <div className="split-page-section">
        <div className="login-split-container">
          {/* LEFT COLUMN: BANNER */}
          <div className="login-left-banner circles-content">
            <span className="left-banner-tag">
              Secure Recovery
            </span>
            <h1 className="left-banner-title">
              {showOtpScreen ? (
                <>
                  Verify your <br />
                  <span style={{ color: "#f17c13" }}>business friends account.</span>
                </>
              ) : (
                <>
                  Recover your <br />
                  <span style={{ color: "#f17c13" }}>business friends account.</span>
                </>
              )}
            </h1>
            <p className="left-banner-desc">
              {showOtpScreen 
                ? "Please check your inbox. Enter the 6-digit verification code along with your new password below."
                : "Enter your email address, and we'll dispatch a secure, 6-digit verification code to reset your account password."
              }
            </p>

            {/* Inline Graphic Card */}
            <div className="left-banner-badge-card">
              <div className="left-banner-badge-icon">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h4 className="left-banner-badge-title">
                  Robust Security Protocols
                </h4>
                <p className="left-banner-badge-desc">
                  We verify One-Time Passwords (OTP) on our backend using tight expiry windows to ensure absolute safety.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: RECOVERY FORM CARD */}
          <div className="login-right-form">
            <div className="form-card-premium">
              <div className="form-card-header">
                <h3 className="form-card-header-title">
                  {showOtpScreen ? "Verify Reset Code" : "Forgot Password?"}
                </h3>
                <p className="form-card-header-desc">
                  {showOtpScreen 
                    ? "Enter the 6-digit code and choose a new password." 
                    : "We'll send verification code instructions directly to you."
                  }
                </p>
              </div>

              {error && (
                <div className="alert-error-premium">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="alert-success-premium">
                  <span>✅</span>
                  <span>{successMessage}</span>
                </div>
              )}

              {!showOtpScreen ? (
                /* FORGOT PASSWORD REQUEST FORM (STEP 1) */
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
                    className="form-submit-btn-premium mb-1-5"
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
                      className="input-premium otp-input-premium"
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
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

                  <div className="input-group-premium mb-1-75">
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
                    className="form-submit-btn-premium mb-1-5"
                  >
                    {loading ? "Saving Password..." : "Save Password"}
                  </button>
                </form>
              )}

              <div 
                className="login-switch-footer"
                onClick={() => {
                  if (showOtpScreen) {
                    setShowOtpScreen(false);
                    setError("");
                    setSuccessMessage("");
                  } else {
                    navigate("/login");
                  }
                }}
              >
                <span>
                  Change Email or Go Back
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
