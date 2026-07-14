import React from "react";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Identify Yourself",
      desc: "Tell us about your organization's vertical, size, and business strengths to establish verification."
    },
    {
      num: "02",
      title: "Declare Your Intent",
      desc: "Post what you are sourcing, services you require, or capabilities you want to supply in natural language."
    },
    {
      num: "03",
      title: "AI Matchmaking",
      desc: "Our semantic engine maps corresponding B2B demands by analyzing alignment and capability."
    },
    {
      num: "04",
      title: "Quality Verification",
      desc: "We review match scores and verify organizational credentials to ensure secure connections."
    },
    {
      num: "05",
      title: "Emailed Introductions",
      desc: "Once a match is validated, we dispatch a detailed lead introduction report directly to your inbox."
    },
    {
      num: "06",
      title: "Warm Handshake",
      desc: "Establish direct contact with your pre-qualified partner and begin contract negotiations."
    }
  ];

  return (
    <section className="section how-it-works" style={{ backgroundColor: "#fbf7f3", padding: "40px 0" }}>
      <div className="container">
        <div className="section-title text-center mb-4">
          <h2 style={{ color: "#f17c13", fontWeight: "800", fontSize: "2rem", marginBottom: "5px" }}>How We Connect</h2>
          <p style={{ color: "#5c4b36", fontSize: "0.95rem", margin: 0 }}>A comprehensive process from intention mapping to direct emailed leads</p>
        </div>

        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div className="row g-3 justify-content-center">
            {steps.map((step, index) => (
              <div key={index} className="col-lg-6 col-md-6">
                <div style={{
                background: "#ffffff",
                padding: "25px 20px",
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
                height: "100%",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.02)",
                cursor: "default"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 15px 20px -5px rgba(0, 0, 0, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.02)";
              }}
              >
                {/* Accent Number Badge */}
                <div style={{
                  fontSize: "0.8rem",
                  fontWeight: "800",
                  color: "#f17c13",
                  backgroundColor: "rgba(241, 124, 19, 0.1)",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  display: "inline-block",
                  marginBottom: "10px"
                }}>
                  Step {step.num}
                </div>

                <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#111827", marginBottom: "6px" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#4b5563", margin: 0, lineHeight: "1.5" }}>
                  {step.desc}
                </p>
              </div>
            </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
