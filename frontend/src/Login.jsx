import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginUser } from "./api";
import bookCover from "./img/book-1-removebg-preview.png";
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

  const activateEmail = searchParams.get("activate_email");

  useEffect(() => {
    if (activateEmail) {
      setLoading(true);
      setError("");
      import("./api").then(async (api) => {
        try {
          await api.activateUser(activateEmail);
          setSuccessInfo("✅ Email verified! Your account is now active. You can log in.");
        } catch (err) {
          setError("❌ Verification failed: " + (err.response?.data?.detail || err.message));
        } finally {
          setLoading(false);
        }
      });
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



  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fbf7f3", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <Header />

      <style>{`
        .login-split-container {
          display: flex;
          align-items: center;
          gap: 4rem;
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
          padding: 0 20px;
          box-sizing: border-box;
        }

        .login-left-banner {
          flex: 1.1;
          color: #111827;
          text-align: left;
          display: flex;
          flex-direction: column;
        }

        .login-right-form {
          flex: 0.9;
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
          max-width: 440px;
          color: #1f2937;
          box-sizing: border-box;
        }

        .input-group-premium {
          margin-bottom: 1.25rem;
        }

        .input-label-premium {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #4b5563;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .input-premium {
          width: 100%;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 0.85rem 1rem;
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
      `}</style>

      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "60px 0" }}>
        <div className="login-split-container">
          {/* LEFT COLUMN: BANNER */}
          <div className="login-left-banner book-hero-content">
            <span className="book-genre" style={{ color: "#f17c13", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              Welcome Back
            </span>
            <h1 style={{ color: "#111827", fontSize: "2.4rem", fontWeight: "800", lineHeight: "1.2", margin: "0 0 1rem 0" }}>
              Partnering to build B2B connections.
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
              Sign in to declare your B2B intention, configure automated match alerts, and manage your profile preferences.
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
                  Verified B2B Matchmaking
                </h4>
                <p
                  style={{
                    margin: "0.25rem 0 0 0",
                    fontSize: "0.85rem",
                    color: "#4b5563",
                    lineHeight: "1.4",
                  }}
                >
                  We securely analyze organization intent to dispatch warm introductions directly to your inbox.
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
                  <label className="input-label-premium">Password</label>
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
