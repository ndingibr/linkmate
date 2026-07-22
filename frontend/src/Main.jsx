import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "./img/small_circles.jpg";
import circlesBg from "./img/small_circles_bg.jpg";
import realHandshake120 from "./img/real_handshake_120deg.png";
import evaluationChecklist from "./img/evaluation_checklist.jpg";
import imgProcurement from "./img/profession_procurement.jpg";
import imgSales from "./img/profession_sales.jpg";
import imgDeveloper from "./img/profession_developer.jpg";
import HowItWorks from "./components/HowItWorks";
import BusinessUsage from "./components/BusinessUsage";
import ContactSection from "./Contact";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { isAuthenticated, logout, getSeoLandingCopy } from "./api";
import { Menu, X, ArrowRight, Sparkles, Building, Briefcase, Mail, CheckCircle, Send, Zap, Search, ChevronDown } from "lucide-react";

export default function Main() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [heroQuery, setHeroQuery] = useState("");
  const [seoData, setSeoData] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || params.get("keyword");
    if (q) {
      getSeoLandingCopy(q)
        .then((data) => {
          setSeoData(data);
          if (data.pre_fill) {
            const cleanPrefill = data.pre_fill.replace(/^e\.g\.\s*["']?|["']?$/gi, "");
            setHeroQuery(cleanPrefill);
          }
        })
        .catch((err) => console.error("Error loading SEO copy:", err));
    }
  }, []);

  const faqItems = [
    {
      q: "How does Small Circles find compatible businesses?",
      a: "We read your description to understand your business objectives, industry, target location, and goals. We then look across our network of verified organizations to find companies whose business requirements align directly with what you do or need."
    },
    {
      q: "Who can see what I write?",
      a: "Your requests are kept secure. We only share details between verified companies when we identify a highly compatible match, ensuring your intentions aren't broadcast publicly."
    },
    {
      q: "How should I describe my business need?",
      a: "Be straightforward. Describe exactly what products, services, or partnerships you are looking for or offering. Specific details like locations or timelines help us find better matches."
    },
    {
      q: "How do I get introduced?",
      a: "Once we confirm a compatible match with another business, we facilitate a direct, warm introduction so you can start a conversation right away."
    },
    {
      q: "Is Small Circles free to use?",
      a: "Sharing your business needs, looking at options, and simulating matches is free. We offer premium verification options if you want to scale up your introductions."
    }
  ];

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (!heroQuery.trim()) return;
    localStorage.setItem("pending_intent", heroQuery.trim());
    if (isAuthenticated()) {
      navigate("/matches");
    } else {
      navigate("/signup", { state: { fromSearch: true } });
    }
  };

  return (
    <>
      <Header />

      {/* Hero Circles Section */}
      <section id="circles" className="circles-section-light">
        <div
          className="container py-lg-5 py-4 my-lg-3 my-0 hero-container-1100"
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
          <div className="row align-items-center justify-content-between" style={{ position: "relative" }}>
            {/* Left Column — Value Prop & Search */}
            <div className="col-lg-8 circles-section-light-banner">
              <span 
                style={{ 
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
                  letterSpacing: "0.02em"
                }}
              >
                Meet Businesses Ready to Do Business
              </span>

              <h1
                style={{
                  color: "#4a5a50",
                  fontSize: "2.8rem",
                  fontWeight: "600",
                  lineHeight: "1.15",
                  margin: "0 0 1.2rem 0",
                  letterSpacing: "-0.04em"
                }}
              >
                {seoData && seoData.heading ? (
                  <span style={{ color: "#4a5a50" }}>{seoData.heading}</span>
                ) : (
                  <>
                    What does <br />
                    your business <br />
                    <span style={{ color: "#ec5e3b" }}>need today?</span>
                  </>
                )}
              </h1>

              <p
                style={{
                  color: "#4b5563",
                  fontSize: "1.08rem",
                  fontWeight: "500",
                  lineHeight: "1.6",
                  margin: "0 0 2.2rem 0"
                }}
              >
                {seoData && seoData.description ? (
                  seoData.description
                ) : (
                  "Tell us what you're looking for - or what your business offers. We'll introduce you directly to compatible companies and the right decision-maker, bypassing the gatekeepers and starting straight with a warm conversation."
                )}
              </p>

              <form onSubmit={handleHeroSearch} style={{ position: "relative", maxWidth: "740px", marginBottom: "1.5rem" }}>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Search size={20} style={{ position: "absolute", left: "20px", color: "#9ca3af" }} />
                  
                  <input
                    type="text"
                    value={heroQuery}
                    onChange={(e) => setHeroQuery(e.target.value)}
                    placeholder={seoData && seoData.pre_fill ? seoData.pre_fill : 'e.g. "Looking for food packaging suppliers in Gauteng..."'}
                    style={{
                      width: "100%",
                      padding: "16px 130px 16px 54px",
                      borderRadius: "32px",
                      border: "1px solid #d1d5db",
                      fontSize: "0.98rem",
                      color: "#374151",
                      backgroundColor: "#ffffff",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
                      outline: "none",
                      transition: "all 0.3s ease",
                      boxSizing: "border-box"
                    }}
                  />

                  <button
                    type="submit"
                    style={{
                      position: "absolute",
                      right: "8px",
                      backgroundColor: "#ec5e3b",
                      color: "#ffffff",
                      border: "none",
                      padding: "10px 22px",
                      borderRadius: "24px",
                      fontWeight: "600",
                      fontSize: "0.88rem",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(236, 94, 59, 0.3)"
                    }}
                  >
                    Connect
                  </button>
                </div>
              </form>

              <span style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>
                ✦ No credit card required &nbsp;·&nbsp; Under 2 minutes to start
              </span>
            </div>

            {/* Right Column — Handshake Picture */}
            <div className="col-lg-4 hero-handshake-col" style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", minHeight: "340px", zIndex: 1 }}>
              <style>{`
                @media (max-width: 991px) {
                  .hero-handshake-col {
                    min-height: auto !important;
                    margin-top: 32px !important;
                    justify-content: center !important;
                    width: 100% !important;
                  }
                  .hero-handshake-circle {
                    position: relative !important;
                    top: 0 !important;
                    right: 0 !important;
                    transform: none !important;
                    margin: 0 auto !important;
                  }
                }
              `}</style>

              <div
                className="hero-handshake-circle"
                style={{
                  width: "280px",
                  height: "280px",
                  borderRadius: "50%",
                  backgroundColor: "#d1d5db",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  position: "absolute",
                  right: "0",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  zIndex: 1
                }}
              >
                <img
                  src={realHandshake120}
                  alt="Business Matchmaking Connection"
                  style={{
                    width: "120%",
                    height: "auto",
                    display: "block",
                    opacity: 0.95
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* How businesses use Small Circles */}
      <BusinessUsage />

      {/* What to Look For Section */}
      <section
        style={{
          backgroundColor: "#f2f6f3",
          padding: "65px 0",
          borderTop: "1px solid #dbe3dd",
          borderBottom: "1px solid #dbe3dd"
        }}
      >
        <div className="container" style={{ maxWidth: "960px", margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "48px" }}>
            
            <div style={{ flex: "1 1 300px" }}>
              <span
                style={{
                  color: "#4a5d5e",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "0.75rem",
                  display: "block",
                  marginBottom: "0.75rem"
                }}
              >
                VETTING STANDARDS
              </span>
              <h3
                style={{
                  color: "#111827",
                  fontSize: "1.8rem",
                  fontWeight: "600",
                  lineHeight: "1.25",
                  margin: 0,
                  letterSpacing: "-0.02em"
                }}
              >
                {seoData && seoData.canonical_term ? (
                  `Evaluating ${seoData.canonical_term} Partners`
                ) : (
                  "Evaluating Business Circle Partners"
                )}
              </h3>
              <p style={{ color: "#4b5563", marginTop: "1rem", fontSize: "0.92rem", lineHeight: "1.5" }}>
                {seoData && seoData.canonical_term ? (
                  `Recommended evaluation criteria and compliance standards for reviewing ${seoData.canonical_term} requirements.`
                ) : (
                  "Recommended standards and trust factors to verify when establishing relationships in our partner introduction network."
                )}
              </p>

              {/* Evaluation Criteria Checklist */}
              <div style={{ marginTop: "1.2rem", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#35453f", fontSize: "0.9rem", fontWeight: "600" }}>
                  <span style={{ color: "#ec5e3b", fontWeight: "bold" }}>✓</span> Business Registration & Compliance Standing
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#35453f", fontSize: "0.9rem", fontWeight: "600" }}>
                  <span style={{ color: "#ec5e3b", fontWeight: "bold" }}>✓</span> Proven Industry Track Record & Verified Client References
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#35453f", fontSize: "0.9rem", fontWeight: "600" }}>
                  <span style={{ color: "#ec5e3b", fontWeight: "bold" }}>✓</span> Operational Capacity & Service Delivery Readiness
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#35453f", fontSize: "0.9rem", fontWeight: "600" }}>
                  <span style={{ color: "#ec5e3b", fontWeight: "bold" }}>✓</span> Transparent Commercial Terms & Financial Health
                </div>
              </div>
            </div>

            {/* Right / Centered Image Column */}
            <div className="vetting-image-col" style={{ flex: "0 0 180px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <style>{`
                @media (max-width: 768px) {
                  .vetting-image-col {
                    flex: 1 1 100% !important;
                    justify-content: center !important;
                    margin-top: 16px !important;
                  }
                  .vetting-image-circle {
                    margin: 0 auto !important;
                  }
                }
              `}</style>
              <div 
                className="vetting-image-circle"
                style={{
                  width: "180px",
                  height: "180px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  border: "3px solid #d1d5db",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
                }}
              >
                <img
                  src={evaluationChecklist}
                  alt="Vetting and Trust Verification"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ backgroundColor: "#ffffff", padding: "60px 0" }}>
        <div className="container" style={{ maxWidth: "960px", margin: "0 auto", padding: "0 20px" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span style={{ color: "#ec5e3b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.8rem" }}>
              Questions & Answers
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "#35453f", marginTop: "0.4rem" }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {faqItems.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "16px",
                    backgroundColor: "#f8fafc",
                    overflow: "hidden"
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    style={{
                      width: "100%",
                      padding: "20px 24px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <span style={{ fontWeight: "700", color: "#35453f", fontSize: "1rem" }}>
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={20}
                      style={{
                        color: "#ec5e3b",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.25s ease"
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div style={{ padding: "0 24px 20px" }}>
                      <p style={{ color: "#4b5563", fontSize: "0.9rem", lineHeight: "1.6", margin: 0 }}>
                        {faq.a}
                      </p>
                    </div>
                  )}
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