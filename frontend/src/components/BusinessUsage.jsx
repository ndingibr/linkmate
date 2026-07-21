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
            Simple connections designed for commercial procurement, growth, and development.
          </p>
        </div>

        {/* 3-Column Categories Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "30px"
        }}>
          {categories.map((cat, index) => {
            const isHovered = hoveredCard === index;
            return (
              <div 
                key={index} 
                style={{
                  background: isHovered ? cat.hoverBg : "#ffffff",
                  padding: "32px 28px",
                  borderRadius: "16px",
                  border: isHovered ? `1px solid ${cat.hoverBorder}` : "1px solid rgba(0, 0, 0, 0.06)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "default",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: isHovered ? "0 12px 30px rgba(38, 70, 58, 0.03)" : "none",
                  transform: isHovered ? "translateY(-4px)" : "translateY(0)"
                }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Header Title & Serif Number */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "flex-start", 
                  marginBottom: "16px" 
                }}>
                  <h3 style={{ 
                    fontSize: "1.25rem", 
                    fontWeight: "600", 
                    color: "#35453f", 
                    margin: 0,
                    letterSpacing: "-0.01em"
                  }}>
                    {cat.title}
                  </h3>
                  <span style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: "2.2rem",
                    fontWeight: "600",
                    color: isHovered ? cat.accent : "rgba(53, 69, 63, 0.12)",
                    lineHeight: 1,
                    transition: "color 0.3s ease"
                  }}>
                    {cat.num}
                  </span>
                </div>

                {/* Subtle Divider Rule */}
                <div style={{ height: "1px", backgroundColor: "#eef2f5", marginBottom: "20px" }} />

                {/* List of items with custom en-dash bullets */}
                <ul style={{ 
                  listStyle: "none", 
                  padding: 0, 
                  margin: 0, 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "10px" 
                }}>
                  {cat.items.map((item, i) => (
                    <li 
                      key={i} 
                      style={{ 
                        display: "flex", 
                        alignItems: "baseline", 
                        gap: "10px",
                        fontSize: "0.95rem",
                        color: "#4b5563",
                        lineHeight: "1.4"
                      }}
                    >
                      <span style={{ color: cat.accent, fontWeight: "700", fontSize: "0.85rem" }}>—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
