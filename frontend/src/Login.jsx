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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fffcf9", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <Header />

      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "60px 0" }}>
        <div className="login-split-container">
          {/* LEFT COLUMN: BANNER */}
          <div className="login-left-banner book-hero-content">
            <span className="book-genre" style={{ color: "#f17c13", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              Welcome Back
            </span>
            <h1 style={{ color: "#111827", fontSize: "2.4rem", fontWeight: "800", lineHeight: "1.2", margin: "0 0 1rem 0" }}>
              Start developing your circle of business friends.
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
              When you register you can declare your goal of friendship. You will meet people with complementary skills and goals - verified.
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
                  Verified Circle Growing
                </h4>
                <p
                  style={{
                    margin: "0.25rem 0 0 0",
                    fontSize: "0.85rem",
                    color: "#4b5563",
                    lineHeight: "1.4",
                  }}
                >
                  Meet and match with professional business partners having complementary skills, goals, and verified intentions.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LOGIN FORM CARD */}
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
                Sign In
              </h2>
              <p
                style={{
                  color: "#6b7280",
                  fontSize: "0.9rem",
                  margin: "0 0 2rem 0",
                }}
              >
                Enter your credentials to manage your B2B intention.
              </p>

              {error && (
                <div className="alert-error-premium">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {successInfo && (
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

                  <div className="input-group-premium" style={{ marginBottom: "1.75rem" }}>
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
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 6px 20px rgba(241, 124, 19, 0.35)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.boxShadow =
                        "0 4px 15px rgba(241, 124, 19, 0.2)";
                    }}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyActivationOtp}>
                  <div className="input-group-premium" style={{ marginBottom: "1.75rem" }}>
                    <label className="input-label-premium">6-Digit Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      className="input-premium"
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      style={{ letterSpacing: "0.25em", textAlign: "center", fontSize: "1.25rem", fontWeight: "800" }}
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

              <p
                style={{
                  margin: "1.5rem 0 0 0",
                  textAlign: "center",
                  fontSize: "0.85rem",
                  color: "#6b7280",
                }}
              >
                Don't have an account yet?{" "}
                <span
                  style={{
                    color: "#f17c13",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                  onClick={() => navigate("/register")}
                >
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
