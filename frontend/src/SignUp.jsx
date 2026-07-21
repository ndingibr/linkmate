import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signUpUser, activateUser } from "./api";
import Header from "./components/Header";
import Footer from "./components/Footer";
import imgThreeProfessionals from "./img/three_professionals.png";

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company_name: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingIntent, setPendingIntent] = useState("");
  const [fullName, setFullName] = useState("");
  const [showIntent, setShowIntent] = useState(false);
  const [intentLoading, setIntentLoading] = useState(false);
  const [loaderText, setLoaderText] = useState("Analyzing search query...");

  const [userIntent, setUserIntent] = useState("");
  const [preselectedDriver, setPreselectedDriver] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Check if a driver was selected on the home page or search was performed
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
    const driver = location.state?.driver;
    if (driver) {
      setPreselectedDriver(driver);
      setUserIntent(driver.intent);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    const updatedForm = {
      ...form,
      first_name: firstName,
      last_name: lastName
    };

    try {
      // Save intent to localStorage so user can access it in their dashboard once signed up
      localStorage.setItem("pending_intent", userIntent || pendingIntent);
      await signUpUser(updatedForm);
      setSuccessMessage(`Sign up successful! We've sent a 6-digit verification code to ${form.email}.`);
      setShowOtpScreen(true);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Sign up failed. Try a different email."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await activateUser(form.email, otpCode);
      setSuccessMessage("✅ Account activated successfully! Redirecting you to sign in...");
      setTimeout(() => {
        navigate("/signin");
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid or expired verification code.");
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
          Already a member? <span style={{ color: "#ec5e3b", cursor: "pointer", fontWeight: "700" }} onClick={() => navigate("/signin")}>Sign In</span>
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
                <span style={{ color: "#ec5e3b", fontWeight: "bold", fontSize: "1.1rem" }}>✓</span> AI Matching
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#35453f", fontSize: "0.95rem", fontWeight: "600" }}>
                <span style={{ color: "#ec5e3b", fontWeight: "bold", fontSize: "1.1rem" }}>✓</span> Private Introductions
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: REGISTER CARD */}
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
                {showIntent && (
                  <div style={{
                    backgroundColor: "#fef8f3",
                    border: "1px solid #fbdcbd",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    marginBottom: "20px",
                    textAlign: "left"
                  }}>
    
                    <div style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Intent query:
                    </div>
                    <div style={{ color: "#ec5e3b", fontWeight: "700", fontSize: "1.05rem", fontStyle: "italic" }}>
                      "{pendingIntent}"
                    </div>
                  </div>
                )}

                <div className="form-card-header" style={{ marginBottom: "24px" }}>
                  <h3 className="form-card-header-title" style={{
                    color: "#35453f",
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    margin: "0 0 6px 0",
                    letterSpacing: "-0.01em"
                  }}>
                    Create Your Account
                  </h3>
                  <p className="form-card-header-desc" style={{
                    color: "#6b7280",
                    fontSize: "0.9rem",
                    lineHeight: "1.4",
                    margin: 0
                  }}>
                    {showIntent 
                      ? "There are potential partners we would like to introduce you to. Complete the form below to connect."
                      : "Join Small Circles to connect with verified partners matching your business intent."
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
                  <form onSubmit={handleSubmit}>
                    
                    <div className="input-group-premium">
                      <label className="input-label-premium">Full Name</label>
                      <input
                        type="text"
                        className="input-premium"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-row-premium">
                      <div className="input-group-premium flex-1">
                        <label className="input-label-premium">Work Email</label>
                        <input
                          type="email"
                          name="email"
                          className="input-premium"
                          placeholder="john@company.com"
                          value={form.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="input-group-premium flex-1">
                        <label className="input-label-premium">Phone Number</label>
                        <input
                          type="text"
                          name="phone"
                          className="input-premium"
                          placeholder="+27 82 123 4567"
                          value={form.phone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="input-group-premium">
                      <label className="input-label-premium">Company Name</label>
                      <input
                        type="text"
                        name="company_name"
                        className="input-premium"
                        placeholder="Acme Corp"
                        value={form.company_name}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="input-group-premium mb-1-5">
                      <label className="input-label-premium">Password</label>
                      <input
                        type="password"
                        name="password"
                        className="input-premium"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="form-submit-btn-premium"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px"
                      }}
                    >
                      {loading ? "Signing Up..." : "Get My Introductions"}
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
                          transition: "all 0.2s ease",
                          width: "100%"
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
                          transition: "all 0.2s ease",
                          width: "100%"
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
                  <form onSubmit={handleVerifyOtp}>
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
                      {loading ? "Verifying..." : "Verify Code"}
                    </button>
                  </form>
                )}

                {/* Under-button Checklist (Wireframe footer) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "20px", borderTop: "1px solid #f3f4f6", paddingTop: "15px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "0.82rem", fontWeight: "500" }}>
                    <span style={{ color: "#ec5e3b", fontWeight: "bold" }}>✓</span> No public profile
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "0.82rem", fontWeight: "500" }}>
                    <span style={{ color: "#ec5e3b", fontWeight: "bold" }}>✓</span> Verified businesses only
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "0.82rem", fontWeight: "500" }}>
                    <span style={{ color: "#ec5e3b", fontWeight: "bold" }}>✓</span> Takes less than 60 seconds
                  </div>
                </div>

                <p className="login-switch-footer">
                  Already have an account?{" "}
                  <span onClick={() => navigate("/signin")} style={{ color: "#ec5e3b", fontWeight: "700" }}>
                    Sign In here
                  </span>
                </p>
              </div> {/* closes inner div */}
            </div> {/* closes form-card-premium */}
          </div> {/* closes login-right-form */}

        </div> {/* closes login-split-container */}
      </div> {/* closes split-page-section */}

      <Footer />
    </div>
  );
}
