import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { registerUser, activateUser } from "./api";
import { MessageSquare, Zap, ArrowRight, CheckCircle, ShieldCheck } from "lucide-react";
import Header from "./components/Header";
import Footer from "./components/Footer";

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

  const [userIntent, setUserIntent] = useState("");
  const [preselectedDriver, setPreselectedDriver] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Check if a driver was selected on the home page to associate it with their profile
  useEffect(() => {
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

    try {
      // Save intent to localStorage so user can access it in their dashboard once registered
      localStorage.setItem("pending_intent", userIntent);
      await registerUser(form);
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fffcf9", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <Header />

      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "60px 0" }}>
        <div className="login-split-container">
          {/* LEFT COLUMN: BANNER */}
          <div className="login-left-banner book-hero-content">
            <span className="book-genre" style={{ color: "#f17c13", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              Join Us
            </span>
            <h1 style={{ color: "#111827", fontSize: "2.4rem", fontWeight: "800", lineHeight: "1.2", margin: "0 0 1rem 0" }}>
              Build a network of business people who get it.
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
              State your business goals when you register. Our AI matches you with verified professionals whose skills and needs complement yours.
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
                  Verified Matchmaking
                </h4>
                <p
                  style={{
                    margin: "0.25rem 0 0 0",
                    fontSize: "0.85rem",
                    color: "#4b5563",
                    lineHeight: "1.4",
                  }}
                >
                  Connect with verified professionals who align with your goals and complement your expertise.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CONVERSATIONAL ONBOARDING / REGISTER CARD */}
          <div className="login-right-form">
            <div className="form-card-premium" style={{ textAlign: "left" }}>
              
              {/* ACCOUNT REGISTRATION FORM */}
              <div>
                {/* Personalized welcome banner when driver was pre-selected */}
                {preselectedDriver ? (
                  <div style={{
                    backgroundColor: "#fffcf9",
                    border: "1px solid #eddcd2",
                    borderRadius: "14px",
                    padding: "16px 18px",
                    marginBottom: "24px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px"
                  }}>
                    <span style={{
                        fontSize: "0.72rem",
                        fontWeight: "800",
                        color: "#f17c13",
                        backgroundColor: "rgba(241, 124, 19, 0.1)",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        display: "inline-block",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        marginTop: "2px"
                      }}>{preselectedDriver.badge}</span>
                    <div>
                      <p style={{ margin: "0 0 4px", fontWeight: "700", fontSize: "0.9rem", color: "#111827" }}>
                        Great choice! Let's get you registered.
                      </p>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "#5c4b36", lineHeight: "1.5" }}>
                        We've noted your driver: <em>"{preselectedDriver.label}"</em><br />
                        Complete the details below and we'll start matching for you right away.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "1.35rem", fontWeight: "800", color: "#111827", margin: "0 0 0.5rem 0" }}>
                      Create Your Account
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#4b5563" }}>
                      Join SmallCircles to connect with verified partners matching your business intent.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="alert-error-premium">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                {successMessage && (
                  <div style={{
                    backgroundColor: "#ecfdf5",
                    color: "#065f46",
                    border: "1px solid #a7f3d0",
                    borderRadius: "12px",
                    padding: "0.75rem 1rem",
                    marginBottom: "1.5rem",
                    fontSize: "0.85rem",
                    fontWeight: "500",
                  }}>
                    {successMessage}
                  </div>
                )}

              {!showOtpScreen ? (
                <form onSubmit={handleSubmit}>
                  <div className="form-row-premium">
                    <div className="input-group-premium" style={{ flex: 1 }}>
                      <label className="input-label-premium">First Name</label>
                      <input
                        type="text"
                        name="first_name"
                        className="input-premium"
                        placeholder="John"
                        value={form.first_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="input-group-premium" style={{ flex: 1 }}>
                      <label className="input-label-premium">Last Name</label>
                      <input
                        type="text"
                        name="last_name"
                        className="input-premium"
                        placeholder="Doe"
                        value={form.last_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row-premium">
                    <div className="input-group-premium" style={{ flex: 1 }}>
                      <label className="input-label-premium">Email Address</label>
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
                    <div className="input-group-premium" style={{ flex: 1 }}>
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

                  <div className="input-group-premium" style={{ marginBottom: "1.5rem" }}>
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
                    style={{
                      background: "linear-gradient(135deg, #f17c13 0%, #d96a0a 100%)",
                      color: "#ffffff",
                      padding: "0.85rem",
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
                    {loading ? "Registering & Claiming Leads..." : "Register & Claim Leads"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
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
                      padding: "0.85rem",
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
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>
                </form>
              )}
              </div>

              <p
                style={{
                  margin: "1.5rem 0 0 0",
                  textAlign: "center",
                  fontSize: "0.85rem",
                  color: "#6b7280",
                }}
              >
                Already have an account?{" "}
                <span
                  style={{
                    color: "#f17c13",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                  onClick={() => navigate("/login")}
                >
                  Login here
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
