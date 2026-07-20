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
    <div className="split-page-wrapper">
      <Header />

      <div className="split-page-section">
        <div className="login-split-container">
          {/* LEFT COLUMN: BANNER */}
          <div className="login-left-banner circles-content">
            <span className="left-banner-tag">
              Join Us
            </span>
            <h1 className="left-banner-title">
              Build a network of <br />
              <span style={{ color: "#f17c13" }}>business friends who get it.</span>
            </h1>
            <p className="left-banner-desc">
              State your business goals when you register. Our AI matches you with verified business friends whose skills and needs complement yours.
            </p>

            {/* Inline Graphic Card */}
            <div className="left-banner-badge-card">
              <div className="left-banner-badge-icon">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h4 className="left-banner-badge-title">
                  Verified Matchmaking
                </h4>
                <p className="left-banner-badge-desc">
                  Connect with verified business friends who align with your goals and complement your expertise.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CONVERSATIONAL ONBOARDING / REGISTER CARD */}
          <div className="login-right-form">
            <div className="form-card-premium">
              
              {/* ACCOUNT REGISTRATION FORM */}
              <div>
                {/* Personalized welcome banner when driver was pre-selected */}
                {preselectedDriver ? (
                  <div className="welcome-driver-banner">
                    <span className="welcome-driver-badge">{preselectedDriver.badge}</span>
                    <div>
                      <p className="welcome-driver-title">
                        Great choice! Let's get you registered.
                      </p>
                      <p className="welcome-driver-desc">
                        We've noted your driver: <em>"{preselectedDriver.label}"</em><br />
                        Complete the details below and we'll start matching for you right away.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="form-card-header">
                    <h3 className="form-card-header-title">
                      Create Your Account
                    </h3>
                    <p className="form-card-header-desc">
                      Join Small Circles to connect with verified business friends matching your business intent.
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
                  <div className="alert-success-premium">
                    {successMessage}
                  </div>
                )}

              {!showOtpScreen ? (
                <form onSubmit={handleSubmit}>
                  <div className="form-row-premium">
                    <div className="input-group-premium flex-1">
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
                    <div className="input-group-premium flex-1">
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
                    <div className="input-group-premium flex-1">
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
                  >
                    {loading ? "Registering & Matching Friends..." : "Register & Match Friends"}
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
              </div>

              <p className="login-switch-footer">
                Already have an account?{" "}
                <span onClick={() => navigate("/login")}>
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
