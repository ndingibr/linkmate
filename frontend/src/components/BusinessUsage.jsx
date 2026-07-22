import React, { useState } from "react";

export default function BusinessUsage() {
  const [hoveredCard, setHoveredCard] = useState(null);

  const categories = [
    {
      title: "Buy & Source",
      num: "1",
      items: [
        "Find suppliers",
        "Source manufacturers",
        "Locate logistics partners"
      ],
      accent: "#26463a",
      hoverBg: "#f4f7f5",
      hoverBorder: "rgba(38, 70, 58, 0.3)"
    },
    {
      title: "Sell & Grow",
      num: "2",
      items: [
        "Find new customers",
        "Discover distributors",
        "Explore export opportunities"
      ],
      accent: "#ec5e3b",
      hoverBg: "#fffbf9",
      hoverBorder: "rgba(236, 94, 59, 0.3)"
    },
    {
      title: "Build & Innovate",
      num: "3",
      items: [
        "Hire consultants",
        "Discover technology partners",
        "Find investors",
        "Form strategic partnerships"
      ],
      accent: "#35453f",
      hoverBg: "#f7f8f7",
      hoverBorder: "rgba(53, 69, 63, 0.3)"
    }
  ];

  return (
    <div className="section business-usage" style={{ padding: "50px 0", backgroundColor: "#eef1f6" }}>
      <div className="container" style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "35px" }}>
          <h2 style={{ 
            color: "#35453f", 
            fontWeight: "600", 
            fontSize: "2.2rem", 
            margin: "0 0 12px 0",
            letterSpacing: "-0.02em"
          }}>
            How businesses use Small Circles
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
            Connect directly with verified corporate partners across three main focus areas.
          </p>
        </div>

        {/* 3 Focus Columns */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px"
        }}>
          {categories.map((cat, idx) => {
            const isHovered = hoveredCard === idx;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredCard(idx)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: isHovered ? cat.hoverBg : "#ffffff",
                  borderRadius: "20px",
                  padding: "32px 24px",
                  border: `1px solid ${isHovered ? cat.hoverBorder : "#e5e7eb"}`,
                  boxShadow: isHovered 
                    ? "0 12px 30px rgba(0, 0, 0, 0.06)" 
                    : "0 2px 10px rgba(0, 0, 0, 0.02)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "20px"
                  }}>
                    <h3 style={{
                      fontSize: "1.35rem",
                      fontWeight: "600",
                      color: "#111827",
                      margin: 0
                    }}>
                      {cat.title}
                    </h3>
                    <span style={{
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      color: cat.accent,
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                      padding: "4px 10px",
                      borderRadius: "12px"
                    }}>
                      0{cat.num}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {cat.items.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", color: "#4b5563", fontSize: "0.95rem" }}>
                        <span style={{ color: "#ec5e3b", fontWeight: "bold" }}>✓</span> {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
