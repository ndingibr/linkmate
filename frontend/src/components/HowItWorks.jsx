import React from "react";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Company Analysis",
      desc: "We analyze your business, operations, and goals to identify key growth areas."
    },
    {
      num: "02",
      title: "Technology Proposals",
      desc: "We design custom proposals marrying your existing business knowledge with digital and AI technology."
    },
    {
      num: "03",
      title: "Flexible Contracts",
      desc: "We structure custom agreements with flexible terms—whether it is payment on delivery, milestones, or equity."
    },
    {
      num: "04",
      title: "Build & Test",
      desc: "Our engineering team designs, builds, and rigorously tests your custom solution."
    },
    {
      num: "05",
      title: "Implement & Support",
      desc: "We implement the technology into your business and promise to be there as long-term partners."
    },
    {
      num: "06",
      title: "Scale & Optimize",
      desc: "We monitor performance, refine algorithms, and continuously scale features to drive ongoing value."
    }
  ];

  return (
    <section className="section how-it-works" style={{ backgroundColor: "#fbf7f3", padding: "40px 0" }}>
      <div className="container">
        <div className="section-title text-center mb-4">
          <h2 style={{ color: "#f17c13", fontWeight: "800", fontSize: "2rem", marginBottom: "5px" }}>How We Engage</h2>
          <p style={{ color: "#5c4b36", fontSize: "0.95rem", margin: 0 }}>A comprehensive process from strategic analysis to long-term digital partnership</p>
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
