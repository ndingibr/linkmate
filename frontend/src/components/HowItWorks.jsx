import React from "react";

export default function HowItWorks() {
  const steps = [
    {
      num: "1",
      title: "Describe your business needs",
      desc: (
        <>
          <p style={{ margin: "0 0 12px 0", lineHeight: "1.6", color: "#4b5563", fontSize: "0.92rem" }}>
            Tell us what you're looking for - or what your business offers - in plain language. No rigid forms, just write naturally.
          </p>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#6b7280", lineHeight: "1.4" }}>
            <span style={{ fontWeight: "700", color: "#35453f", marginRight: "6px", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em" }}>e.g.</span>
            "Looking for food packaging suppliers in Gauteng."
          </p>
        </>
      )
    },
    {
      num: "2",
      title: "We look beyond the keywords",
      desc: (
        <>
          <p style={{ margin: 0, lineHeight: "1.6", color: "#4b5563", fontSize: "0.92rem" }}>
            We analyze your request to understand the core objective - your industry, targets, location, and goals. We match based on what you actually want to achieve, not just search terms.
          </p>
        </>
      )
    },
    {
      num: "3",
      title: "Find compatible companies",
      desc: (
        <>
          <p style={{ margin: 0, lineHeight: "1.6", color: "#4b5563", fontSize: "0.92rem" }}>
            We scan our network for verified companies whose needs or capabilities complement yours. Every match is chosen for direct business compatibility.
          </p>
        </>
      )
    },
    {
      num: "4",
      title: "Reach the decision-maker",
      desc: (
        <>
          <p style={{ margin: 0, lineHeight: "1.6", color: "#4b5563", fontSize: "0.92rem" }}>
            Finding the company is only half the battle. We identify the relevant contact responsible for evaluating the opportunity - whether that's in procurement, sales, or partnerships.
          </p>
        </>
      )
    },
    {
      num: "5",
      title: "A direct introduction",
      desc: (
        <>
          <p style={{ margin: 0, lineHeight: "1.6", color: "#4b5563", fontSize: "0.92rem" }}>
            Once we find a match, we introduce you directly. You bypass gatekeepers, cold email spam, and directories, starting straight with a warm conversation.
          </p>
        </>
      )
    },
    {
      num: "6",
      title: "Begin direct discussions",
      desc: (
        <>
          <p style={{ margin: 0, lineHeight: "1.6", color: "#4b5563", fontSize: "0.92rem" }}>
            Start talking directly with the decision-maker. Take your opportunity forward, build relationships, and execute contracts with verified partners.
          </p>
        </>
      )
    }
  ];

  return (
    <div className="section how-it-works" style={{ padding: "30px 0 15px", backgroundColor: "#ffffff" }}>
      <div className="container" style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* Header Title Section */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2 style={{ 
            color: "#35453f", 
            fontWeight: "600", 
            fontSize: "2.2rem", 
            margin: "0 0 12px 0",
            letterSpacing: "-0.02em"
          }}>
            How We Connect
          </h2>
          <p style={{ 
            color: "#6b7280", 
            fontSize: "1rem", 
            margin: 0, 
            maxWidth: "500px",
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: "1.5"
          }}>
            A simple, direct process designed to bypass traditional cold outreach.
          </p>
        </div>

        {/* Process Cards Grid Layout */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px"
        }}>
          {steps.map((step, index) => {
            return (
              <div 
                key={index} 
                style={{
                  background: "#ffffff",
                  padding: "24px 20px",
                  borderRadius: "16px",
                  border: "1px solid #eef1f6",
                  position: "relative",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "default",
                  display: "flex",
                  flexDirection: "column"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.borderColor = "#ec5e3b";
                  e.currentTarget.style.boxShadow = "0 20px 40px rgba(236, 94, 59, 0.04)";
                  const borderLine = e.currentTarget.querySelector(".step-card-top-border");
                  if (borderLine) borderLine.style.backgroundColor = "#ec5e3b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "#eef1f6";
                  e.currentTarget.style.boxShadow = "none";
                  const borderLine = e.currentTarget.querySelector(".step-card-top-border");
                  if (borderLine) borderLine.style.backgroundColor = "#eef1f6";
                }}
              >
                {/* Clean Top Border Indicator */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  backgroundColor: "#eef1f6",
                  borderTopLeftRadius: "16px",
                  borderTopRightRadius: "16px",
                  transition: "background-color 0.3s ease"
                }} 
                className="step-card-top-border"
                />

                {/* Big Step Number */}
                <div style={{
                  fontSize: "3.2rem",
                  fontWeight: "700",
                  color: "rgba(38, 70, 58, 0.08)",
                  lineHeight: "1",
                  marginBottom: "8px",
                  fontFamily: "'Outfit', sans-serif"
                }}>
                  {step.num}
                </div>

                <h3 style={{ 
                  fontSize: "1.15rem", 
                  fontWeight: "600", 
                  color: "#35453f", 
                  margin: "0 0 8px 0",
                  letterSpacing: "-0.01em"
                }}>
                  {step.title}
                </h3>
                <div style={{ flexGrow: 1 }}>
                  {step.desc}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
