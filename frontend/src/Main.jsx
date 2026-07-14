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

      {/* Hero Section */}
      <section
        id="hero"
        className="hero section"
        style={{
          background: "linear-gradient(180deg, #fbf7f3 0%, #ffffff 100%)",
          padding: "80px 0",
          borderBottom: "1px solid #eddcd2"
        }}
      >
        <div
          className="container"
          data-aos="fade-up"
          data-aos-delay="100"
          style={{
            maxWidth: "1200px",
            padding: "0 20px",
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
            background: "transparent"
          }}
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
                <span className="book-genre" style={{ color: "#f17c13", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.85rem", display: "block", marginBottom: "0.5rem" }}>
                  AI-Powered B2B Matching
                </span>

                <h1
                  style={{
                    color: "#111827",
                    fontSize: "2.4rem",
                    fontWeight: "800",
                    lineHeight: "1.2",
                    margin: "0 0 1rem 0"
                  }}
                >
                  Bridge the gap between organizations. Meet business partners with intent.
                </h1>

                <h2
                  className="book-description"
                  style={{ color: "#5c4b36", fontSize: "1.05rem", fontWeight: "500", lineHeight: "1.6", margin: "0 0 2.5rem 0" }}
                >
                  LinkMate maps actual current B2B intent. Declare your business needs or offerings, and let our AI match complementary intentions to dispatch verified leads directly to your inbox.
                </h2>

              </div>
            </div>

            {/* Right Column — Driver Question Card */}
            <div className="col-lg-6">
              <div style={{
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                border: "1px solid rgb(237, 220, 210)",
                boxShadow: "rgba(92, 75, 54, 0.06) 0px 20px 40px",
                padding: "32px 30px 28px",
                position: "relative",
                textAlign: "left"
              }}>

                {/* Card Header */}
                <div style={{ marginBottom: "24px", borderBottom: "1px solid #f3f4f6", paddingBottom: "18px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#f17c13", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Quick Start</span>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "#111827", lineHeight: "1.3" }}>
                    What's your biggest driver right now?
                  </h3>
                  <p style={{ margin: "8px 0 0", fontSize: "0.875rem", color: "#6b7280", lineHeight: "1.5" }}>
                    Pick the one that resonates most — we'll set up your profile around it.
                  </p>
                </div>

                {/* Driver Options */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {drivers.map((d, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleDriverSelect(d)}
                      style={{
                        textAlign: "left",
                        padding: "16px 18px",
                        borderRadius: "14px",
                        border: "1px solid #eddcd2",
                        backgroundColor: "#fbf7f3",
                        fontSize: "0.9rem",
                        color: "#111827",
                        fontWeight: "500",
                        cursor: "pointer",
                        lineHeight: "1.45",
                        transition: "all 0.18s ease",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "14px"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "#ffffff";
                        e.currentTarget.style.border = "1px solid #f17c13";
                        e.currentTarget.style.boxShadow = "0 4px 14px rgba(241,124,19,0.08)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "#fbf7f3";
                        e.currentTarget.style.border = "1px solid #eddcd2";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
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
                      }}>{d.badge}</span>
                      <span>{d.label}</span>
                    </button>
                  ))}
                </div>

                {/* Footer note */}
                <p style={{ margin: "20px 0 0", fontSize: "0.78rem", color: "#9ca3af", textAlign: "center" }}>
                  ✦ No credit card required &nbsp;·&nbsp; Takes less than 2 minutes
                </p>

              </div>
            </div>
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