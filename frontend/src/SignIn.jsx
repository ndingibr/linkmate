import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { signInUser } from "./api";
import Footer from "./components/Footer";
import imgThreeProfessionals from "./img/three_professionals.png";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState("");
  const [showActivationOtp, setShowActivationOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const [pendingIntent, setPendingIntent] = useState("");
  const [showIntent, setShowIntent] = useState(false);
  const [intentLoading, setIntentLoading] = useState(false);
  const [loaderText, setLoaderText] = useState("Analyzing search query...");

  const activateEmail = searchParams.get("activate_email");

  useEffect(() => {
    const savedIntent = localStorage.getItem("pending_intent");
    const isFromSearch = location.state?.fromSearch;
    if (savedIntent && isFromSearch) {
      setPendingIntent(savedIntent);
      setIntentLoading(true);
      setLoaderText("Analyzing search query...");
      
      const t1 = setTimeout(() => {
        setLoaderText("Scanning circles network for partners...");
      }, 1500);

      const t2 = setTimeout(() => {
        setLoaderText("Finding verified decision-makers...");
      }, 3000);

      const t3 = setTimeout(() => {
        setIntentLoading(false);
        setShowIntent(true);
      }, 4500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
    if (activateEmail) {
      setEmail(activateEmail);
      setShowActivationOtp(true);
      setSuccessInfo(`Please enter the 6-digit verification code sent to ${activateEmail} to activate your account.`);
    }
  }, [activateEmail, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInUser({ email, password });
      navigate("/profile");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Sign in failed. Please check your credentials."
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
          New to Small Circles? <span style={{ color: "#ec5e3b", cursor: "pointer", fontWeight: "700" }} onClick={() => navigate("/signup")}>Sign Up</span>
        </div>
      </div>

      <div className="split-page-section" style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <div className="login-split-container" style={{ display: "flex", gap: "60px", flexWrap: "wrap", width: "100%", maxWidth: "1060px", margin: "0 auto", padding: "0 24px", boxSizing: "border-box", alignItems: "center" }}>
          
          {/* LEFT COLUMN: BRAND VALUE PROP INSPIRATION FROM HERO */}
          <div className="login-left-banner circles-content" style={{ 
            flex: "1 1 450px", 
            color: "#35453f",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}>
            
            {/* Conditional Layout A (From Search) vs B (Direct Navigation) */}
            {intentLoading ? (
              <div style={{
                marginBottom: "2rem",
                width: "100%",
                padding: "20px",
                borderRadius: "16px",
                border: "1px solid rgba(236, 94, 59, 0.2)",
                backgroundColor: "rgba(236, 94, 59, 0.03)",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                animation: "pulse 1.8s infinite ease-in-out"
              }}>
                <style>{`
                  @keyframes pulse {
                    0% { opacity: 0.7; }
                    50% { opacity: 1; }
                    100% { opacity: 0.7; }
                  }
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "18px",
                    height: "18px",
                    border: "2.5px solid rgba(236, 94, 59, 0.2)",
                    borderTopColor: "#ec5e3b",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite"
                  }} />
                  <span style={{ color: "#35453f", fontWeight: "700", fontSize: "0.88rem" }}>
                    Small Circles AI Engine
                  </span>
                </div>
                <div style={{ color: "#ec5e3b", fontWeight: "600", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Status: {loaderText}
                </div>
              </div>
            ) : showIntent ? (
              <div style={{
                marginBottom: "2rem",
                width: "100%",
                boxSizing: "border-box"
              }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ color: "#ec5e3b", fontWeight: "bold", fontSize: "1.1rem" }}>✓</span>
                  <span style={{ color: "#35453f", fontWeight: "700", fontSize: "0.9rem" }}>
                    We found businesses that may match your needs:
                  </span>
                </div>
                <div style={{ color: "#6b7280", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                  Looking for
                </div>
                <div style={{ color: "#ec5e3b", fontWeight: "700", fontSize: "1.3rem", fontStyle: "italic", lineHeight: "1.3" }}>
                  "{pendingIntent}"
                </div>
              </div>
            ) : (
              <>
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
                  Meet Businesses Ready to Do Business
                </span>
                <h1 className="left-banner-title" style={{
                  color: "#35453f",
                  fontSize: "2.5rem",
                  fontWeight: "600",
                  lineHeight: "1.2",
                  margin: "0 0 1.2rem 0",
                  letterSpacing: "-0.03em"
                }}>
                  Connect with <br />
                  verified <span style={{ color: "#ec5e3b" }}>partners.</span>
                </h1>
              </>
            )}

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
              Small Circles doesn't show you hundreds of listings.
            </p>
            <p style={{
              color: "#4b5563",
              fontSize: "1rem",
              fontWeight: "500",
              lineHeight: "1.5",
              margin: "0 0 1.8rem 0"
            }}>
              We introduce businesses that are most likely to work with you.
            </p>

            {/* Checklist items from wireframe */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0 0 1rem 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#35453f", fontSize: "0.95rem", fontWeight: "600" }}>
                <span style={{ color: "#ec5e3b", fontWeight: "bold", fontSize: "1.1rem" }}>✓</span> Verified Businesses
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#35453f", fontSize: "0.95rem", fontWeight: "600" }}>
                <span style={{ color: "#ec5e3b", fontWeight: "bold", fontSize: "1.1rem" }}>✓</span> AI Matching
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#35453f", fontSize: "0.95rem", fontWeight: "600" }}>
                <span style={{ color: "#ec5e3b", fontWeight: "bold", fontSize: "1.1rem" }}>✓</span> Private Introductions
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LOGIN FORM CARD */}
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
              <div className="form-card-header" style={{ marginBottom: "24px" }}>
                <h3 className="form-card-header-title" style={{
                  color: "#35453f",
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  margin: "0 0 6px 0",
                  letterSpacing: "-0.01em"
                }}>
                  Sign In
                </h3>
              </div>

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

              {successInfo && (
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
                  <span>✅</span>
                  <span>{successInfo}</span>
                </div>
              )}

              {!showActivationOtp ? (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="input-group-premium" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label className="input-label-premium" style={{ color: "#374151", fontSize: "0.85rem", fontWeight: "600" }}>Email Address</label>
                    <input
                      type="email"
                      className="input-premium"
                      placeholder="name@company.com"
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "0.9rem",
                        outline: "none"
                      }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group-premium" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                      <label className="input-label-premium" style={{ color: "#374151", fontSize: "0.85rem", fontWeight: "600", margin: 0 }}>Password</label>
                      <span 
                        style={{ color: "#ec5e3b", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" }}
                        onClick={() => navigate("/forgot-password")}
                      >
                        Forgot password?
                      </span>
                    </div>
                    <input
                      type="password"
                      className="input-premium"
                      placeholder="••••••••"
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "0.9rem",
                        outline: "none"
                      }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                    {loading ? "Signing in..." : "Sign In"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyActivationOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="input-group-premium" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label className="input-label-premium" style={{ color: "#374151", fontSize: "0.85rem", fontWeight: "600" }}>6-Digit Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      className="input-premium otp-input-premium"
                      placeholder="123456"
                      style={{
                        padding: "12px 14px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "1.1rem",
                        fontWeight: "700",
                        letterSpacing: "0.3em",
                        textAlign: "center",
                        outline: "none",
                        marginBottom: "8px"
                      }}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
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
                      width: "100%"
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
                      color: "#ec5e3b",
                      cursor: "pointer",
                      fontWeight: "600",
                      marginTop: "8px"
                    }}
                  >
                    Cancel & Back to Sign In
                  </div>
                </form>
              )}

              {/* Under-button Checklist (Wireframe footer) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "20px", borderTop: "1px solid #f3f4f6", paddingTop: "15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "0.82rem", fontWeight: "500" }}>
                  <span style={{ color: "#ec5e3b", fontWeight: "bold" }}>✓</span> Secure Login
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "0.82rem", fontWeight: "500" }}>
                  <span style={{ color: "#ec5e3b", fontWeight: "bold" }}>✓</span> Private Dashboard
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "0.82rem", fontWeight: "500" }}>
                  <span style={{ color: "#ec5e3b", fontWeight: "bold" }}>✓</span> Real-time matches
                </div>
              </div>

              <p className="login-switch-footer" style={{ 
                textAlign: "center", 
                marginTop: "24px", 
                fontSize: "0.85rem",
                color: "#6b7280"
              }}>
                Don't have an account yet?{" "}
                <span 
                  onClick={() => navigate("/signup")} 
                  style={{ color: "#ec5e3b", fontWeight: "700", cursor: "pointer" }}
                >
                  Sign Up here
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
