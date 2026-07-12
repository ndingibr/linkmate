import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "./api";
import logoImg from "./img/ventureai_logo.jpg";
import bookCover from "./img/book-1-removebg-preview.png";
import heroBg from "./img/ventureai_hero.jpg";

export default function Register() {
  const navigate = useNavigate();
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerUser(form);
      alert("Registration successful! Please login.");
      navigate("/login");
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
          max-width: 480px;
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

          <span className="book-genre">Join Us</span>
          <h1 style={{ color: "#ffffff", fontSize: "2.4rem" }}>
            Start building the future with custom AI solutions.
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
            Register to manage your corporate pricing, configure data
            integrations, and launch customized search engines.
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

        {/* RIGHT COLUMN: REGISTER FORM CARD */}
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
              Register
            </h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.9rem",
                margin: "0 0 1.5rem 0",
              }}
            >
              Create your account to start managing your dynamic quotes.
            </p>

            {error && (
              <div className="alert-error-premium">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-row-premium">
                <div className="input-group-premium" style={{ flex: 1 }}>
                  <label className="input-label-premium">First Name</label>
                  <input
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
                    name="last_name"
                    className="input-premium"
                    placeholder="Doe"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="input-group-premium">
                <label className="input-label-premium">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="input-premium"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group-premium">
                <label className="input-label-premium">Phone Number</label>
                <input
                  name="phone"
                  className="input-premium"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group-premium">
                <label className="input-label-premium">Company Name</label>
                <input
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
                {loading ? "Creating Account..." : "Create Account"}
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
    </section>
  );
}
