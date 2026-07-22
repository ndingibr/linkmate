import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signUpUser, activateUser, createUserIntent, updateUserProfile, analyzeIntent } from "./api";
import Header from "./components/Header";
import Footer from "./components/Footer";
import imgThreeProfessionals from "./img/three_professionals.png";

export default function SignUp() {
  const navigate = useNavigate();

  // Wizard Step State: 1 (Identity), 2 (Verification), 3 (Intention & Budget)
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields State
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    company_name: "",
    role: "",
    location: "",
    type: "buy",
    intention: "",
    influence: "Recommend / Influence",
    has_budget: false,
    budget_min: "",
    budget_max: "",
    budget_currency: "ZAR",
    intent_lifespan: "90 Days"
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // OTP State
  const [otpCode, setOtpCode] = useState("");
  const [companyVerified, setCompanyVerified] = useState(false);

  // AI Evaluation State
  const [aiScore, setAiScore] = useState(null);
  const [aiClarity, setAiClarity] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  // Location Autocomplete State
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const COMMON_LOCATIONS = [
    "Sandton, Johannesburg", "Centurion, Pretoria", "Stellenbosch, Cape Town",
    "Umhlanga, Durban", "Randburg, Johannesburg", "Rosebank, Johannesburg",
    "Midrand, Johannesburg", "Pretoria East, Pretoria", "Cape Town City Centre",
    "Bellville, Cape Town", "Somerset West, Cape Town", "Durban North, Durban",
    "Gqeberha (Port Elizabeth)", "Bloemfontein, Free State", "Polokwane, Limpopo",
    "Nelspruit (Mbombela), Mpumalanga", "Rustenburg, North West", "George, Garden Route",
    "Soweto, Johannesburg", "Johannesburg, Gauteng", "Cape Town, Western Cape",
    "Durban, KwaZulu-Natal", "Pretoria, Gauteng", "South Africa"
  ];

  useEffect(() => {
    const savedIntent = localStorage.getItem("pending_intent");
    if (savedIntent && savedIntent.trim()) {
      setForm(f => ({ ...f, intention: savedIntent }));
    }
  }, []);

  useEffect(() => {
    if (!form.intention || !form.intention.trim()) {
      setAiScore(null); setAiClarity("");
      return;
    }
    const t = setTimeout(async () => {
      setAnalyzing(true);
      try {
        const result = await analyzeIntent(form.intention);
        setAiScore(result.score);
        setAiClarity(result.clarity_level);
      } catch (e) {
        console.warn("AI evaluation fallback:", e);
      } finally {
        setAnalyzing(false);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [form.intention]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleLocationChange = (val) => {
    setForm({ ...form, location: val });
    if (val.trim()) {
      const filtered = COMMON_LOCATIONS.filter(loc => loc.toLowerCase().includes(val.toLowerCase()));
      setLocationSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const isCorporateDomain = () => {
    if (!form.email || !form.email.includes("@")) return false;
    const domain = form.email.toLowerCase().split("@")[1];
    const publicWebmail = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "live.com", "aol.com", "protonmail.com", "zoho.com"];
    return !publicWebmail.includes(domain);
  };

  // ════ STEP 1: IMMEDIATELY HIT DATABASE WITH USER DETAILS & SEND OTP ════
  const handleSignUpStep1 = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    if (!form.first_name.trim()) { setError("First Name is required."); return; }
    if (!form.last_name.trim()) { setError("Surname / Last Name is required."); return; }
    if (!form.email || !form.email.includes("@")) { setError("Valid email address is required."); return; }
    if (!form.password || form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!form.company_name.trim()) { setError("Company Name is required."); return; }

    setLoading(true);
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      company_name: form.company_name.trim(),
      role: form.role.trim()
    };

    try {
      await signUpUser(payload);
      setSuccessMessage(`Account created! We've sent a 6-digit verification code to ${form.email}.`);
      setCurrentStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Sign up failed. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  // ════ STEP 2: VERIFY OTP CODE ════
  const handleVerifyOtpStep2 = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    if (!otpCode || otpCode.length < 6) {
      setError("Please enter the full 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await activateUser(form.email, otpCode);
      const isCorp = res?.company_verified;
      setCompanyVerified(isCorp);

      if (res?.access_token) {
        localStorage.setItem("linkmate_auth_token", res.access_token);
      }

      setSuccessMessage(
        isCorp
          ? "🎉 Email Verified & Company Listing Auto-Verified! Please describe your business intention below."
          : "✅ Email Verified! Please describe your business intention below."
      );

      setCurrentStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  // ════ STEP 3: SUBMIT BUSINESS INTENTION & LOCATION, THEN GO TO MATCHES ════
  const handleCompleteIntentionStep3 = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.location || !form.location.trim()) {
      setError("Please specify your company location.");
      return;
    }
    if (!form.intention || !form.intention.trim()) {
      setError("Please provide a brief business intention statement.");
      return;
    }

    setLoading(true);
    try {
      // Update location on profile
      await updateUserProfile({ location: form.location });

      // Save initial intention
      const intentPayload = {
        title: `${form.company_name} Intention`,
        type: form.type || "buy",
        intention: form.intention.trim(),
        influence: form.influence,
        has_budget: form.has_budget,
        budget_min: form.budget_min ? parseFloat(form.budget_min) : null,
        budget_max: form.budget_max ? parseFloat(form.budget_max) : null,
        budget_currency: form.budget_currency,
        intent_lifespan: form.intent_lifespan
      };

      await createUserIntent(intentPayload);
      localStorage.removeItem("pending_intent");

      setSuccessMessage("Business intention created! Redirecting straight to your matches...");
      setTimeout(() => {
        navigate("/matches", { state: { justRegistered: true } });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save intention. Redirecting to matches...");
      setTimeout(() => {
        navigate("/matches", { state: { justRegistered: true } });
      }, 1800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-page-wrapper" style={{ backgroundColor: "#eef1f6", minHeight: "100vh", display: "flex", flexDirection: "column", padding: "40px 0" }}>

      {/* TOP HEADER ROW: WIDE CONTAINER (1420px) */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        maxWidth: "1420px",
        margin: "0 auto 2.5rem auto",
        padding: "0 24px",
        boxSizing: "border-box"
      }}>
        {/* Logo */}
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
        <div
          className="login-split-container"
          style={{
            display: "flex",
            gap: "60px",
            flexWrap: "wrap",
            width: "100%",
            maxWidth: currentStep === 1 ? "1420px" : "800px",
            margin: "0 auto",
            padding: "0 24px",
            boxSizing: "border-box",
            alignItems: "center",
            justifyContent: currentStep === 1 ? "space-between" : "center"
          }}
        >
          {/* LEFT COLUMN: BRAND VALUE PROP BANNER (RENDERED ONLY IN STEP 1 & HIDDEN ON MOBILE) */}
          {currentStep === 1 && (
            <div className="login-left-banner circles-content" style={{ 
              flex: "1 1 520px", 
              color: "#35453f",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center"
            }}>
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

              {/* Circle Image Frame */}
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
          )}

          {/* RIGHT / MAIN COLUMN: FORM CARD */}
          <div className="login-right-form" style={{ flex: currentStep === 1 ? "1 1 600px" : "1 1 100%", display: "flex", justifyContent: currentStep === 1 ? "flex-end" : "center", width: "100%" }}>
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
              
              {/* Stepper Indicator */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", position: "relative" }}>
                <div style={{ position: "absolute", top: "16px", left: "15%", right: "15%", height: "2px", background: "#e5e7eb", zIndex: 1 }} />
                
                {[
                  { num: 1, label: "Identity" },
                  { num: 2, label: "Verification" },
                  { num: 3, label: "Intention & Budget" }
                ].map((step) => {
                  const isActive = currentStep === step.num;
                  const isDone = currentStep > step.num;
                  return (
                    <div key={step.num} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2 }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: isActive ? "#ec5e3b" : isDone ? "#10b981" : "#f3f4f6",
                        color: isActive || isDone ? "#ffffff" : "#9ca3af",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: "700", fontSize: "0.85rem",
                        boxShadow: isActive ? "0 4px 10px rgba(236, 94, 59, 0.3)" : "none"
                      }}>
                        {isDone ? "✓" : step.num}
                      </div>
                      <span style={{ fontSize: "0.78rem", fontWeight: isActive ? "700" : "500", color: "#065f46", marginTop: "6px", textTransform: "none", letterSpacing: "normal" }}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
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
                  <span>✅</span>
                  <span>{successMessage}</span>
                </div>
              )}

              {/* ════ STEP 1: USER & COMPANY IDENTITY (HITS DATABASE DIRECTLY) ════ */}
              {currentStep === 1 && (
                <form onSubmit={handleSignUpStep1} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="form-card-header" style={{ marginBottom: "8px" }}>
                    <h3 className="form-card-header-title" style={{ color: "#35453f", fontSize: "1.4rem", fontWeight: "600", margin: "0 0 4px 0" }}>
                      Create Your Account
                    </h3>
                    <p className="form-card-header-desc" style={{ color: "#6b7280", fontSize: "0.88rem", margin: 0 }}>
                      Step 1: Contact details and company identity
                    </p>
                  </div>

                  <div className="form-row-premium">
                    <div className="input-group-premium flex-1" style={{ flex: 1 }}>
                      <label className="input-label-premium">First Name *</label>
                      <input type="text" name="first_name" className="input-premium" placeholder="John" value={form.first_name} onChange={handleChange} required />
                    </div>
                    <div className="input-group-premium flex-1" style={{ flex: 1 }}>
                      <label className="input-label-premium">Surname *</label>
                      <input type="text" name="last_name" className="input-premium" placeholder="Doe" value={form.last_name} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="form-row-premium">
                    <div className="input-group-premium flex-1" style={{ flex: 1 }}>
                      <label className="input-label-premium">Work Email *</label>
                      <input type="email" name="email" className="input-premium" placeholder="john@company.com" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="input-group-premium flex-1" style={{ flex: 1 }}>
                      <label className="input-label-premium">Phone Number</label>
                      <input type="text" name="phone" className="input-premium" placeholder="+27 82 123 4567" value={form.phone} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="form-row-premium">
                    <div className="input-group-premium flex-1" style={{ flex: 1 }}>
                      <label className="input-label-premium">Company Name *</label>
                      <input type="text" name="company_name" className="input-premium" placeholder="Acme Corp" value={form.company_name} onChange={handleChange} required />
                    </div>
                    <div className="input-group-premium flex-1" style={{ flex: 1 }}>
                      <label className="input-label-premium">Job Title / Role</label>
                      <input type="text" name="role" className="input-premium" placeholder="Procurement Director" value={form.role} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="input-group-premium">
                    <label className="input-label-premium">Password *</label>
                    <input type="password" name="password" className="input-premium" placeholder="••••••••" value={form.password} onChange={handleChange} required />
                  </div>

                  {/* SIGN UP BUTTON (HITS DATABASE & DISPATCHES OTP) */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="form-submit-btn-premium"
                      style={{
                        backgroundColor: "#ec5e3b",
                        color: "#ffffff",
                        border: "none",
                        padding: "14px 36px",
                        borderRadius: "30px",
                        fontWeight: "700",
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(236, 94, 59, 0.35)"
                      }}
                    >
                      {loading ? "Creating Account..." : "Sign Up"}
                    </button>
                  </div>
                </form>
              )}

              {/* ════ STEP 2: ACCOUNT & COMPANY VERIFICATION (ENTER OTP) ════ */}
              {currentStep === 2 && (
                <form onSubmit={handleVerifyOtpStep2} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="form-card-header" style={{ marginBottom: "8px" }}>
                    <h3 className="form-card-header-title" style={{ color: "#35453f", fontSize: "1.4rem", fontWeight: "600", margin: "0 0 4px 0" }}>
                      Email Verification
                    </h3>
                    <p className="form-card-header-desc" style={{ color: "#6b7280", fontSize: "0.88rem", margin: 0 }}>
                      Step 2: Enter the 6-digit code sent to <strong>{form.email}</strong>.
                    </p>
                  </div>

                  {/* Corporate vs Webmail Domain Status Banner */}
                  <div style={{
                    padding: "12px 16px", borderRadius: "12px", marginBottom: "8px", fontSize: "0.82rem",
                    backgroundColor: isCorporateDomain() ? "#f0fdf4" : "#fef8f3",
                    border: `1px solid ${isCorporateDomain() ? "#86efac" : "#fbdcbd"}`,
                    color: isCorporateDomain() ? "#166534" : "#b45309"
                  }}>
                    {isCorporateDomain() ? (
                      <div>
                        <strong>🏢 Corporate Domain Email ({form.email.split("@")[1]})</strong>
                        <p style={{ margin: "4px 0 0", fontSize: "0.78rem" }}>Your Company Listing for <strong>{form.company_name}</strong> will be <strong>Auto-Verified</strong> upon confirmation!</p>
                      </div>
                    ) : (
                      <div>
                        <strong>📧 Public Webmail Email Address</strong>
                        <p style={{ margin: "4px 0 0", fontSize: "0.78rem" }}>Your account will be activated, but company listing will remain unverified until domain proof is confirmed.</p>
                      </div>
                    )}
                  </div>

                  <div className="input-group-premium">
                    <label className="input-label-premium">6-Digit Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      className="input-premium otp-input-premium"
                      style={{ fontSize: "1.5rem", letterSpacing: "0.25em", textAlign: "center" }}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </div>

                  {/* VERIFY BUTTON */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="form-submit-btn-premium"
                      style={{
                        backgroundColor: "#ec5e3b",
                        color: "#ffffff",
                        border: "none",
                        padding: "14px 32px",
                        borderRadius: "30px",
                        fontWeight: "700",
                        fontSize: "1rem",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(236, 94, 59, 0.35)"
                      }}
                    >
                      {loading ? "Verifying..." : "Verify Code"}
                    </button>
                  </div>
                </form>
              )}

              {/* ════ STEP 3: BUSINESS INTENTION, LOCATION & BUDGET ════ */}
              {currentStep === 3 && (
                <form onSubmit={handleCompleteIntentionStep3} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="form-card-header" style={{ marginBottom: "8px" }}>
                    <h3 className="form-card-header-title" style={{ color: "#35453f", fontSize: "1.4rem", fontWeight: "600", margin: "0 0 4px 0" }}>
                      Business Intention
                    </h3>
                    <p className="form-card-header-desc" style={{ color: "#6b7280", fontSize: "0.88rem", margin: 0 }}>
                      Step 3: Location, intention statement and criteria
                    </p>
                  </div>

                  {/* Location Autocomplete */}
                  <div className="input-group-premium" style={{ position: "relative" }}>
                    <label className="input-label-premium">Company Location (South Africa) *</label>
                    <input
                      type="text"
                      className="input-premium"
                      placeholder="e.g. Sandton, Centurion, Stellenbosch..."
                      value={form.location}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      required
                    />
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#ffffff", border: "1px solid #d1d5db", borderRadius: "8px", margin: "4px 0 0", padding: "4px 0", listStyle: "none", zIndex: 100, maxHeight: "160px", overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                        {locationSuggestions.map((loc, idx) => (
                          <li key={idx} style={{ padding: "8px 14px", fontSize: "0.85rem", cursor: "pointer", color: "#374151" }} onMouseDown={() => { setForm({ ...form, location: loc }); setShowSuggestions(false); }}>
                            📍 {loc}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Budget Options */}
                  <div className="input-group-premium" style={{ background: "#f9fafb", padding: "12px 14px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600", color: "#374151" }}>
                      <input type="checkbox" name="has_budget" checked={form.has_budget} onChange={handleChange} style={{ accentColor: "#ec5e3b", width: "16px", height: "16px" }} />
                      Specify Budget / Financial Criteria
                    </label>
                    {form.has_budget && (
                      <div className="form-row-premium" style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <div style={{ flex: 1 }}>
                          <label className="input-label-premium">Currency</label>
                          <select name="budget_currency" className="input-premium" value={form.budget_currency} onChange={handleChange}>
                            <option value="ZAR">ZAR (R)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="input-label-premium">Min Budget</label>
                          <input type="number" name="budget_min" className="input-premium" placeholder="e.g. 50000" value={form.budget_min} onChange={handleChange} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="input-label-premium">Max Budget</label>
                          <input type="number" name="budget_max" className="input-premium" placeholder="e.g. 200000" value={form.budget_max} onChange={handleChange} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Intention Statement */}
                  <div className="input-group-premium">
                    <label className="input-label-premium">Intention Statement *</label>
                    <textarea
                      name="intention"
                      rows={3}
                      className="input-premium"
                      style={{ resize: "vertical" }}
                      placeholder="Describe specifically what your business needs or offers..."
                      value={form.intention}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* AI Strength Evaluation */}
                  {form.intention && (
                    <div style={{ background: "#f9fafb", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#4b5563", marginBottom: "4px" }}>
                        <span>Intention Clarity</span>
                        <span style={{ color: aiScore >= 75 ? "#10b981" : "#ec5e3b" }}>{analyzing ? "Evaluating..." : `${aiClarity} (${aiScore || 0}%)`}</span>
                      </div>
                      <div style={{ height: "6px", background: "#e5e7eb", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${aiScore || 0}%`, background: aiScore >= 75 ? "#10b981" : "#ec5e3b", transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  )}

                  {/* Influence & Lifespan */}
                  <div className="form-row-premium">
                    <div className="input-group-premium flex-1" style={{ flex: 1 }}>
                      <label className="input-label-premium">Decision Influence</label>
                      <select name="influence" className="input-premium" value={form.influence} onChange={handleChange}>
                        <option value="Sole Decision Maker">Sole Decision Maker</option>
                        <option value="Recommend / Influence">Recommend / Influence</option>
                        <option value="No Direct Influence">No Direct Influence</option>
                      </select>
                    </div>
                    <div className="input-group-premium flex-1" style={{ flex: 1 }}>
                      <label className="input-label-premium">Active Lifespan</label>
                      <select name="intent_lifespan" className="input-premium" value={form.intent_lifespan} onChange={handleChange}>
                        <option value="30 Days">30 Days</option>
                        <option value="90 Days">90 Days</option>
                        <option value="6 Months">6 Months</option>
                        <option value="Indefinite">Indefinite</option>
                      </select>
                    </div>
                  </div>

                  {/* FINISH BUTTON */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        backgroundColor: "#ec5e3b",
                        color: "#ffffff",
                        border: "none",
                        padding: "14px 36px",
                        borderRadius: "30px",
                        fontWeight: "700",
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(236, 94, 59, 0.35)"
                      }}
                    >
                      {loading ? "Completing Registration..." : "Complete & View Matches"}
                    </button>
                  </div>
                </form>
              )}

              {/* Under-button Checklist */}
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

              <p className="login-switch-footer" style={{ textAlign: "center", marginTop: "16px", fontSize: "0.85rem", color: "#6b7280" }}>
                Already have an account?{" "}
                <span onClick={() => navigate("/signin")} style={{ color: "#ec5e3b", fontWeight: "700", cursor: "pointer" }}>
                  Sign In here
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
