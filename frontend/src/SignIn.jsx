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
      navigate("/matches");
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
        maxWidth: "1280px",
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
        <div className="login-split-container" style={{ display: "flex", gap: "60px", flexWrap: "wrap", width: "100%", maxWidth: "1280px", margin: "0 auto", padding: "0 24px", boxSizing: "border-box", alignItems: "center" }}>
          
          {/* LEFT COLUMN: BRAND VALUE PROP INSPIRATION FROM HERO */}
          <div className="login-left-banner circles-content" style={{ 
            flex: "1 1 520px", 
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
                    Small Circles Matchmaker Engine
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
                    There are potential partners that may match your needs:
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
                <span style={{ color: "#ec5e3b", fontWeight: "bold", fontSize: "1.1rem" }}>✓</span> Verified Synergy Matching
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
                <p className="form-card-header-desc" style={{
                  color: "#6b7280",
                  fontSize: "0.9rem",
                  lineHeight: "1.4",
                  margin: 0
                }}>
                  {showIntent 
                    ? "We found potential partners matching your request. Sign in to view these introductions and connect directly."
                    : "Sign in to connect with verified partners matching your business intent."
                  }
                </p>
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

                  <div style={{ display: "flex", alignItems: "center", margin: "16px 0" }}>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }}></div>
                    <span style={{ padding: "0 12px", color: "#9ca3af", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>or</span>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }}></div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => window.location.href = "/auth/google"}
                      style={{
                        background: "#ffffff",
                        color: "#374151",
                        border: "1px solid #d1d5db",
                        padding: "10px 16px",
                        borderRadius: "24px",
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                      </svg>
                      Continue with Google
                    </button>

                    <button
                      type="button"
                      onClick={() => window.location.href = "/auth/linkedin"}
                      style={{
                        background: "#ffffff",
                        color: "#374151",
                        border: "1px solid #d1d5db",
                        padding: "10px 16px",
                        borderRadius: "24px",
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" fill="#0A66C2" />
                      </svg>
                      Continue with LinkedIn
                    </button>
                  </div>
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
