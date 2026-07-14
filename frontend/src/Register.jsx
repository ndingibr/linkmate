import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { registerUser } from "./api";
import bookCover from "./img/book-1-removebg-preview.png";
import { MessageSquare, Zap, ArrowRight, CheckCircle } from "lucide-react";
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
      setSuccessMessage("Registration successful! A verification email has been sent to ndingibr@gmail.com. Please confirm to activate your intent. Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 4000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Registration failed. Try a different email."
      );
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fbf7f3", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <Header />

      <style>{`
        .login-split-container {
          display: flex;
          align-items: center;
          gap: 4rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          padding: 0 20px;
          box-sizing: border-box;
        }

        .login-left-banner {
          flex: 1;
          color: #111827;
          text-align: left;
          display: flex;
          flex-direction: column;
        }

        .login-right-form {
          flex: 1.2;
          display: flex;
          justify-content: flex-end;
          width: 100%;
        }

        .form-card-premium {
          background: #ffffff;
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
          width: 100%;
          max-width: 580px;
          color: #1f2937;
          box-sizing: border-box;
        }

        .input-group-premium {
          margin-bottom: 1rem;
        }

        .input-label-premium {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #4b5563;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.4rem;
        }

        .input-premium {
          width: 100%;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: #111827;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .input-premium:focus {
          border-color: #f17c13;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(241, 124, 19, 0.15);
        }

        .alert-error-premium {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-row-premium {
          display: flex;
          gap: 1rem;
        }

        @media (max-width: 991px) {
          .login-split-container {
            flex-direction: column;
            gap: 3rem;
          }
          
          .login-left-banner {
            text-align: center;
            align-items: center;
          }

          .login-right-form {
            justify-content: center;
          }
        }

        @media (max-width: 576px) {
          .form-row-premium {
            flex-direction: column;
            gap: 0;
          }
        }
      `}</style>

      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "60px 0" }}>
        <div className="login-split-container">
          {/* LEFT COLUMN: BANNER */}
          <div className="login-left-banner book-hero-content">
            <span className="book-genre" style={{ color: "#f17c13", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              Join Us
            </span>
            <h1 style={{ color: "#111827", fontSize: "2.4rem", fontWeight: "800", lineHeight: "1.2", margin: "0 0 1rem 0" }}>
              Start building the future with custom B2B matches.
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
              Register to manage your B2B intentions, configure match data filters, and connect directly with complementary verified partners.
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
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                maxWidth: "500px",
                boxSizing: "border-box",
              }}
            >
              <img
                src={bookCover}
                alt="Book"
                style={{ height: "64px", objectFit: "contain" }}
              />
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "#111827" }}>
                  AI-Powered B2B Matching
                </h4>
                <p
                  style={{
                    margin: "0.25rem 0 0 0",
                    fontSize: "0.85rem",
                    color: "#4b5563",
                    lineHeight: "1.4",
                  }}
                >
                  We map complementary business needs and dispatch verified lead reports directly to you.
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
                      Join LinkMate to connect with verified partners matching your business intent.
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
