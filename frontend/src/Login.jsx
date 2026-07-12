import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "./api";
import logoImg from "./img/ventureai_logo.jpg";
import bookCover from "./img/book-1-removebg-preview.png";
import heroBg from "./img/ventureai_hero.jpg";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleOAuth = (provider) => {
    const dummyCode = prompt(
      `Enter sandbox code/email prefix for ${provider} authentication:`,
      "testuser"
    );
    if (!dummyCode) return;

    setLoading(true);
    import("./api").then(async (api) => {
      try {
        if (provider.toLowerCase() === "google") {
          await api.googleLogin(dummyCode);
        } else {
          await api.linkedinLogin(dummyCode);
        }
        navigate("/profile");
      } catch (err) {
        setError(`${provider} login failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <section
      style={{
        backgroundImage: `linear-gradient(rgba(241, 124, 19, 0.94), rgba(217, 106, 10, 0.94)), url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "40px 0",
        boxSizing: "border-box",
      }}
    >
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
          color: #ffffff;
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
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
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

        .oauth-btn-premium {
          flex: 1;
          background: #ffffff;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .oauth-btn-premium:hover {
          background: #f9fafb;
          border-color: #9ca3af;
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

      <div className="login-split-container">
        {/* LEFT COLUMN: BANNER */}
        <div className="login-left-banner book-hero-content">
          {/* Logo & Back to Home */}
          <div
            onClick={() => navigate("/")}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#ffffff",
              fontWeight: "bold",
              fontSize: "1.6rem",
              marginBottom: "2.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            <img
              src={logoImg}
              alt="Logo"
              style={{
                height: "36px",
                width: "36px",
                borderRadius: "8px",
                objectFit: "cover",
              }}
            />
            <span>
              venture<span style={{ color: "#1F2937" }}>ai</span>
            </span>
          </div>

          <span className="book-genre">Welcome Back</span>
          <h1 style={{ color: "#ffffff", fontSize: "2.4rem" }}>
            Partnering to build AI products for the future.
          </h1>
          <h2
            className="book-description"
            style={{
              fontSize: "1.05rem",
              color: "rgba(255, 255, 255, 0.9)",
              lineHeight: "1.6",
              margin: "0 0 2.5rem 0",
              maxWidth: "500px",
            }}
          >
            Sign in to access custom pricing quotes, test intelligence schemas,
            or browse the earnings calendar for model training datasets.
          </h2>

          {/* Inline Graphic Card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              background: "rgba(255, 255, 255, 0.1)",
              padding: "1.25rem 1.5rem",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
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
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700" }}>
                Global AI Co-Building Partner
              </h4>
              <p
                style={{
                  margin: "0.25rem 0 0 0",
                  fontSize: "0.85rem",
                  color: "rgba(255, 255, 255, 0.8)",
                  lineHeight: "1.4",
                }}
              >
                We design, build, and scale custom corporate intelligence
                modules worldwide.
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
              Enter your credentials to manage your quote workspace.
            </p>

            {error && (
              <div className="alert-error-premium">
                <span>⚠️</span>
                <span>{error}</span>
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

            <div style={{ margin: "2rem 0 1.5rem 0", textAlign: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  color: "#9ca3af",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <span
                  style={{
                    flex: 1,
                    height: "1px",
                    backgroundColor: "#e5e7eb",
                  }}
                ></span>
                <span>Or continue with</span>
                <span
                  style={{
                    flex: 1,
                    height: "1px",
                    backgroundColor: "#e5e7eb",
                  }}
                ></span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                marginBottom: "2rem",
              }}
            >
              <button
                onClick={() => handleOAuth("Google")}
                className="oauth-btn-premium"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
              <button
                onClick={() => handleOAuth("LinkedIn")}
                className="oauth-btn-premium"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                LinkedIn
              </button>
            </div>

            <p
              style={{
                margin: 0,
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
    </section>
  );
}
