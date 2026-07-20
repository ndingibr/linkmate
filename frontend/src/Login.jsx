import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginUser } from "./api";
import { ShieldCheck } from "lucide-react";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState("");
  const [showActivationOtp, setShowActivationOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const activateEmail = searchParams.get("activate_email");

  useEffect(() => {
    if (activateEmail) {
      setEmail(activateEmail);
      setShowActivationOtp(true);
      setSuccessInfo(`Please enter the 6-digit verification code sent to ${activateEmail} to activate your account.`);
    }
  }, [activateEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginUser({ email, password });
      navigate("/profile");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyActivationOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessInfo("");
    setLoading(true);
    try {
      const api = await import("./api");
      await api.activateUser(email, otpCode);
      setSuccessInfo("✅ Account activated successfully! You can now sign in.");
      setShowActivationOtp(false);
      setOtpCode("");
    } catch (err) {
      setError("❌ Activation failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="split-page-wrapper">
      <Header />

      <div className="split-page-section">
        <div className="login-split-container">
          {/* LEFT COLUMN: BANNER */}
          <div className="login-left-banner circles-content">
            <span className="left-banner-tag">
              Welcome Back
            </span>
            <h1 className="left-banner-title">
              Start developing your <br />
              <span style={{ color: "#f17c13" }}>circle of business friends.</span>
            </h1>
            <p className="left-banner-desc">
              When you register you can declare your goal of friendship. You will meet people with complementary skills and goals - verified.
            </p>

            {/* Inline Graphic Card */}
            <div className="left-banner-badge-card">
              <div className="left-banner-badge-icon">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h4 className="left-banner-badge-title">
                  Verified Friends Network
                </h4>
                <p className="left-banner-badge-desc">
                  Meet and match with professional business friends having complementary skills, goals, and verified intentions.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LOGIN FORM CARD */}
          <div className="login-right-form">
            <div className="form-card-premium">
              <div className="form-card-header">
                <h3 className="form-card-header-title">
                  Sign In
                </h3>
                <p className="form-card-header-desc">
                  Enter your credentials to manage your business intention.
                </p>
              </div>

              {error && (
                <div className="alert-error-premium">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {successInfo && (
                <div className="alert-success-premium">
                  <span>✅</span>
                  <span>{successInfo}</span>
                </div>
              )}

              {!showActivationOtp ? (
                <form onSubmit={handleSubmit}>
                  <div className="input-group-premium">
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

                  <div className="input-group-premium mb-1-75">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                      <label className="input-label-premium" style={{ margin: 0 }}>Password</label>
                      <span 
                        style={{ color: "#f17c13", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}
                        onClick={() => navigate("/forgot-password")}
                      >
                        Forgot password?
                      </span>
                    </div>
                    <input
                      type="password"
                      className="input-premium"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="form-submit-btn-premium"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyActivationOtp}>
                  <div className="input-group-premium mb-1-75">
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="form-submit-btn-premium mb-1-5"
                  >
                    {loading ? "Verifying..." : "Verify Activation Code"}
                  </button>

                  <div 
                    onClick={() => {
                      setShowActivationOtp(false);
                      setSuccessInfo("");
                      setError("");
                    }}
                    style={{
                      textAlign: "center",
                      fontSize: "0.85rem",
                      color: "#f17c13",
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                  >
                    Cancel & Back to Sign In
                  </div>
                </form>
              )}

              <p className="login-switch-footer">
                Don't have an account yet?{" "}
                <span onClick={() => navigate("/register")}>
                  Register here
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
