import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bookCover from "./img/book-1-removebg-preview.png";
import logoImg from "./img/ventureai_logo.jpg";
import HowItWorks from "./components/HowItWorks";
import ContactSection from "./Contact";
import { isAuthenticated, logout } from "./api";
import { Menu, X } from "lucide-react";

export default function Main() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setAuth(isAuthenticated());
  }, []);

  const handleGetStarted = () => {
    navigate("/earnings"); // Change to "/search" if that's your intended route
  };

  return (
    <>
      {/* Header Navigation */}
      <nav className="main-nav-header">
        {/* Logo */}
        <div onClick={() => navigate("/")} className="main-nav-logo">
          <img
            src={logoImg}
            alt="VentureAI Logo"
            style={{
              height: "35px",
              width: "35px",
              borderRadius: "8px",
              objectFit: "cover",
            }}
          />
          <span>
            venture<span style={{ color: "#1F2937" }}>ai</span>
          </span>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button className="main-nav-toggle-btn" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Right Side */}
        <div className={`main-nav-items-wrapper ${menuOpen ? "open" : ""}`}>
          <span
            onClick={() => { navigate("/"); setMenuOpen(false); }}
            style={{
              cursor: "pointer",
              color: "#ffffff",
              fontWeight: "500",
              fontSize: "0.95rem",
            }}
          >
            Home
          </span>

          <span
            onClick={() => { navigate("/search"); setMenuOpen(false); }}
            style={{
              cursor: "pointer",
              color: "#ffffff",
              fontWeight: "500",
              fontSize: "0.95rem",
            }}
          >
            Products
          </span>

          <span
            onClick={() => { navigate("/earnings-predictor"); setMenuOpen(false); }}
            style={{
              cursor: "pointer",
              color: "#ffffff",
              fontWeight: "500",
              fontSize: "0.95rem",
            }}
          >
            Rally Predictor
          </span>

          <a
            href="#how-it-works-section"
            onClick={() => setMenuOpen(false)}
            style={{
              textDecoration: "none",
              color: "#ffffff",
              fontWeight: "500",
              fontSize: "0.95rem",
            }}
          >
            About Us
          </a>

          <div className="main-nav-auth-group">
            {auth ? (
              <>
                <button
                  onClick={() => { navigate("/profile"); setMenuOpen(false); }}
                  style={{
                    backgroundColor: "transparent",
                    color: "#ffffff",
                    border: "1px solid #ffffff",
                    padding: "0.5rem 1.2rem",
                    borderRadius: "20px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Profile
                </button>

                <button
                  onClick={() => {
                    logout();
                    setAuth(false);
                    setMenuOpen(false);
                    navigate("/login");
                  }}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.5rem 1.2rem",
                    borderRadius: "20px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { navigate("/login"); setMenuOpen(false); }}
                  style={{
                    backgroundColor: "transparent",
                    color: "#ffffff",
                    border: "1px solid #ffffff",
                    padding: "0.5rem 1.2rem",
                    borderRadius: "20px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Login
                </button>

                <button
                  onClick={() => { navigate("/register"); setMenuOpen(false); }}
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#f17c13",
                    border: "none",
                    padding: "0.5rem 1.2rem",
                    borderRadius: "20px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="hero"
        className="hero section"
        style={{
          background: "none",
          backgroundColor: "#f17c13",
          padding: "40px 0",
        }}
      >
        <div
          className="container"
          data-aos="fade-up"
          data-aos-delay="100"
          style={{ background: "transparent" }}
        >
          <div
            className="row align-items-center justify-content-center"
            style={{ background: "transparent" }}
          >
            {/* Left Column */}
            <div className="col-lg-6">
              <div
                className="book-hero-content"
                data-aos="fade-up"
                data-aos-delay="200"
              >
                <span className="book-genre">
                  Global AI Co-Building Partner
                </span>

                <h1
                  style={{
                    color: "#f3f4f6",
                    fontSize: "2.2rem",
                  }}
                >
                  We Partner with Ambitious Companies to Build AI Products for
                  the Future.
                </h1>

                <h2
                  className="book-description"
                  style={{ color: "#e5e7eb" }}
                >
                  We design, build, and scale custom intelligence solutions. By
                  combining deep business strategy with software engineering, we
                  help organizations worldwide turn AI potential into measurable
                  competitive advantage.
                </h2>

                <div className="hero-cta">
                  <button
                    onClick={handleGetStarted}
                    className="btn-primary"
                    style={{
                      backgroundColor: "transparent",
                      color: "#fff",
                      border: "2px solid #fff",
                      fontWeight: "600",
                      padding: "12px 35px",
                      fontSize: "16px",
                      borderRadius: "30px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255,255,255,0.1)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    Let's Build the Future
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div
              className="col-lg-5 d-flex justify-content-center justify-content-lg-end"
              data-aos="zoom-out"
              data-aos-delay="300"
            >
              <div
                className="book-cover"
                style={{
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <img
                  src={bookCover}
                  alt="Book Cover"
                  className="img-fluid"
                  style={{
                    display: "block",
                    position: "relative",
                    zIndex: 2,
                  }}
                />

                <div
                  className="book-shadow"
                  style={{
                    position: "absolute",
                    bottom: "-10px",
                    left: "10%",
                    right: "10%",
                    height: "20px",
                    background: "rgba(0,0,0,0.1)",
                    borderRadius: "50%",
                    filter: "blur(10px)",
                    zIndex: 1,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works-section">
        <HowItWorks />
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        style={{
          backgroundColor: "#111111",
          borderTop: "1px solid #2a2a2a",
          padding: "80px 0",
        }}
      >
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span
              style={{
                color: "#f17c13",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "0.85rem",
              }}
            >
              Get In Touch
            </span>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "#ffffff",
                marginTop: "0.5rem",
              }}
            >
              Contact Us
            </h2>
            <p style={{ color: "#9ca3af", maxWidth: "520px", margin: "0 auto" }}>
              Have a question or want to work together? Fill out the form and we'll be in touch shortly.
            </p>
          </div>
          <ContactSection />
        </div>
      </section>
    </>
  );
}