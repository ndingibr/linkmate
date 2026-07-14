import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "./img/ventureai_logo.jpg";
import heroBg from "./img/ventureai_hero.jpg";
import HowItWorks from "./components/HowItWorks";
import ContactSection from "./Contact";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { isAuthenticated, logout } from "./api";
import { Menu, X, ArrowRight, Sparkles, Building, Briefcase, Mail, CheckCircle, Send, Zap } from "lucide-react";

export default function Main() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const faqItems = [
    {
      q: "How does LinkMate match my B2B intention statement?",
      a: "Our advanced AI semantic engine analyzes your natural language statement, identifying your business needs, strengths, industry vertical, and targets. It then scans complementary statements from other verified organizations to identify high-compatibility B2B alignments."
    },
    {
      q: "Who can see my intention statement?",
      a: "Your statements are analyzed confidentially by the semantic engine. Alignments are generated securely, and direct lead reports are shared only between complementary, verified partners to protect your privacy and credentials."
    },
    {
      q: "What makes a strong B2B intention statement?",
      a: "Be specific and clear. Describe exactly what products, services, or partnerships you are looking to source or supply, including your target location, budget constraints, and delivery timelines."
    },
    {
      q: "How do I receive my verified introductions?",
      a: "Once a complementary intention alignment is verified and meets our compatibility thresholds, we compile a detailed B2B match report and dispatch it directly to your registered email address."
    },
    {
      q: "Is LinkMate free to use?",
      a: "Creating your profile, declaring your B2B intent, and running match simulations is completely free. We offer premium verification and automated introduction lead packages as you scale your sourcing operations."
    }
  ];

  const drivers = [
    {
      badge: "I'm Selling",
      label: "I've got something the market needs — help me find the businesses that want it.",
      intent: "I have a product or service ready to go and I am looking for buyers, distributors, or business clients who need exactly what I offer."
    },
    {
      badge: "I'm Buying",
      label: "I know exactly what I need for my business — I just can't find the right person to deliver it.",
      intent: "I have a specific business need and I am looking for a verified supplier, service provider, or partner who can fulfill it reliably."
    },
    {
      badge: "I'm Connecting",
      label: "I'm not here to sell or buy — I want to meet the right people in my space.",
      intent: "I am looking to expand my professional network and connect with like-minded business owners, industry peers, or strategic partners."
    }
  ];

  const handleDriverSelect = (driver) => {
    navigate("/register", { state: { driver } });
  };

  return (
    <>
      <Header />

      {/* Local styles for premium hover transitions */}
      <style>{`
        .hero-section-dark {
          background: #0b0f19;
          padding: 100px 0 90px;
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
        }
        .glow-circle-1 {
          position: absolute;
          top: -25%;
          left: -10%;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(241, 124, 19, 0.12) 0%, rgba(255,255,255,0) 70%);
          filter: blur(60px);
          pointer-events: none;
        }
        .glow-circle-2 {
          position: absolute;
          bottom: -20%;
          right: -10%;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(244, 63, 94, 0.08) 0%, rgba(255,255,255,0) 70%);
          filter: blur(50px);
          pointer-events: none;
        }
        .ticker-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f17c13;
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          margin-bottom: 1.8rem;
        }
        .intent-matrix-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          width: 100%;
          margin-top: 3.5rem;
        }
        .intent-matrix-card {
          text-align: left;
          padding: 28px 24px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 220px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        }
        .intent-matrix-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: #f17c13;
          transform: translateY(-6px);
          box-shadow: 0 16px 36px rgba(241, 124, 19, 0.18);
        }
        .intent-matrix-card-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
          transition: color 0.2s;
        }
        .intent-matrix-card:hover .intent-matrix-card-title {
          color: #f17c13;
        }
        .intent-matrix-card-desc {
          font-size: 0.85rem;
          color: #9ca3af;
          line-height: 1.5;
          margin: 0;
        }
        .intent-matrix-card-badge {
          font-size: 0.68rem;
          font-weight: 800;
          color: #f17c13;
          background: rgba(241, 124, 19, 0.12);
          padding: 4px 12px;
          border-radius: 12px;
          align-self: flex-start;
          transition: all 0.2s;
        }
        .intent-matrix-card:hover .intent-matrix-card-badge {
          background: #f17c13;
          color: #ffffff;
        }
        @media (max-width: 768px) {
          .intent-matrix-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .intent-matrix-card {
            height: auto;
            min-height: 180px;
          }
        }
      `}</style>

      {/* Hero Section */}
      <section id="hero" className="hero-section-dark">
        {/* Background ambient radial glow circles */}
        <div className="glow-circle-1" />
        <div className="glow-circle-2" />

        <div
          className="container"
          data-aos="fade-up"
          data-aos-delay="100"
          style={{
            maxWidth: "960px",
            padding: "0 20px",
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
            background: "transparent",
            position: "relative",
            zIndex: 2
          }}
        >
          {/* Live matches ticker badge */}
          <div className="ticker-badge">
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f17c13" }}></span>
            ✨ Live introduction: TechCorp matched with Kiran Reddy (2m ago)
          </div>

          {/* Hero text */}
          <div style={{ maxWidth: "700px", margin: "0 auto 1.5rem" }}>
            <h1
              style={{
                color: "#ffffff",
                fontSize: "3.2rem",
                fontWeight: "900",
                lineHeight: "1.1",
                margin: "0 0 1.5rem 0",
                letterSpacing: "-0.04em"
              }}
            >
              The Intent Engine for <br />
              <span style={{
                background: "linear-gradient(135deg, #f17c13 0%, #ff4b2b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                B2B introductions.
              </span>
            </h1>

            <p
              style={{
                color: "#9ca3af",
                fontSize: "1.15rem",
                fontWeight: "400",
                lineHeight: "1.6",
                margin: "0"
              }}
            >
              LinkMate matches business intent. Declare your current offerings, requirements, or networking goals and receive verified introductions directly to your inbox.
            </p>
          </div>

          {/* Drivers Intent Grid */}
          <div className="intent-matrix-grid">
            {drivers.map((d, idx) => (
              <div
                key={idx}
                onClick={() => handleDriverSelect(d)}
                className="intent-matrix-card"
              >
                <div className="intent-matrix-card-badge">
                  {d.badge}
                </div>
                <h3 className="intent-matrix-card-title">
                  {d.badge === "I'm Selling" ? "Provide & Deliver" : d.badge === "I'm Buying" ? "Acquire & Procure" : "Collaborate & Connect"}
                </h3>
                <p className="intent-matrix-card-desc">
                  {d.label}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f17c13", fontSize: "0.82rem", fontWeight: "700", marginTop: "4px" }}>
                  Declare Intent <span style={{ transition: "transform 0.2s ease" }}>→</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer badge */}
          <div style={{ marginTop: "3rem", display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <span style={{ color: "#4b5563", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "6px" }}>
              ✔ No credit cards
            </span>
            <span style={{ color: "#4b5563", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "6px" }}>
              ✦ Instant matching
            </span>
            <span style={{ color: "#4b5563", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "6px" }}>
              ★ 100% verified partners
            </span>
          </div>

        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works-section">
        <HowItWorks />
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        style={{
          backgroundColor: "#ffffff",
          borderTop: "1px solid #e5e7eb",
          padding: "80px 0",
        }}
      >
        <div className="container" style={{ maxWidth: "800px", margin: "0 auto", padding: "0 20px" }}>
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
              Questions & Answers
            </span>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "#111827",
                marginTop: "0.5rem",
              }}
            >
              Frequently Asked Questions
            </h2>
            <p style={{ color: "#5c4b36", fontSize: "0.95rem", margin: "8px 0 0" }}>
              Learn more about how LinkMate connects complementary B2B intentions.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {faqItems.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: "#fbf7f3",
                    transition: "all 0.25s ease"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    style={{
                      width: "100%",
                      padding: "20px 24px",
                      background: "transparent",
                      border: "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "#111827" }}>
                      {faq.q}
                    </span>
                    <span style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#f17c13",
                      transition: "transform 0.2s",
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)"
                    }}>
                      ＋
                    </span>
                  </button>
                  <div
                    style={{
                      maxHeight: isOpen ? "300px" : "0px",
                      opacity: isOpen ? 1 : 0,
                      overflow: "hidden",
                      transition: "all 0.25s cubic-bezier(0, 1, 0.5, 1)",
                      padding: isOpen ? "0 24px 20px" : "0 24px"
                    }}
                  >
                    <p style={{ color: "#4b5563", fontSize: "0.9rem", lineHeight: "1.6", margin: 0 }}>
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}