import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { registerUser, activateUser } from "./api";
import Header from "./components/Header";
import Footer from "./components/Footer";
import imgThreeProfessionals from "./img/three_professionals.png";

export default function Register() {
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
      }, 700);

      const t2 = setTimeout(() => {
        setLoaderText("Finding verified decision-makers...");
      }, 1400);

      const t3 = setTimeout(() => {
        setIntentLoading(false);
        setShowIntent(true);
      }, 2100);

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
      // Save intent to localStorage so user can access it in their dashboard once registered
      localStorage.setItem("pending_intent", userIntent || pendingIntent);
      await registerUser(updatedForm);
      setSuccessMessage(`Registration successful! We've sent a 6-digit verification code to ${form.email}.`);
      setShowOtpScreen(true);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Registration failed. Try a different email."
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
      setSuccessMessage("✅ Account activated successfully! Redirecting you to login...");
      setTimeout(() => {
        navigate("/login");
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
          Already a member? <span style={{ color: "#ec5e3b", cursor: "pointer", fontWeight: "700" }} onClick={() => navigate("/login")}>Sign In</span>
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
                    Join Small Circles to connect with verified partners matching your business intent.
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
                      {loading ? "Registering..." : "Get My Introductions"}
                    </button>
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
                  <span onClick={() => navigate("/login")} style={{ color: "#ec5e3b", fontWeight: "700" }}>
                    Login here
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
