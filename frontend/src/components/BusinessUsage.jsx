import React from "react";
import { ShoppingBag, TrendingUp, Zap, Check } from "lucide-react";

export default function BusinessUsage() {
  const categories = [
    {
      title: "Buy & Source",
      icon: <ShoppingBag size={24} style={{ color: "#26463a" }} />,
      items: [
        "Find suppliers",
        "Source manufacturers",
        "Locate logistics partners"
      ],
      accent: "#26463a"
    },
    {
      title: "Sell & Grow",
      icon: <TrendingUp size={24} style={{ color: "#ec5e3b" }} />,
      items: [
        "Find new customers",
        "Discover distributors",
        "Explore export opportunities"
      ],
      accent: "#ec5e3b"
    },
    {
      title: "Build & Innovate",
      icon: <Zap size={24} style={{ color: "#35453f" }} />,
      items: [
        "Hire consultants",
        "Discover technology partners",
        "Find investors",
        "Form strategic partnerships"
      ],
      accent: "#35453f"
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
            return (
              <div 
                key={index} 
                style={{
                  background: "#ffffff",
                  padding: "28px 24px",
                  borderRadius: "16px",
                  border: "1px solid #e2ece8",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  cursor: "default",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.borderColor = cat.accent;
                  e.currentTarget.style.boxShadow = `0 20px 40px rgba(38, 70, 58, 0.04)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "#e2ece8";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Accent Top Bar */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  backgroundColor: cat.accent,
                  borderTopLeftRadius: "16px",
                  borderTopRightRadius: "16px"
                }} />

                {/* Icon wrapper */}
                <div style={{
                  background: index === 0 ? "rgba(38, 70, 58, 0.06)" : index === 1 ? "rgba(236, 94, 59, 0.06)" : "rgba(53, 69, 63, 0.06)",
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px"
                }}>
                  {cat.icon}
                </div>

                <h3 style={{ 
                  fontSize: "1.2rem", 
                  fontWeight: "600", 
                  color: "#35453f", 
                  margin: "0 0 16px 0",
                  letterSpacing: "-0.01em"
                }}>
                  {cat.title}
                </h3>

                {/* List of items */}
                <ul style={{ 
                  listStyle: "none", 
                  padding: 0, 
                  margin: 0, 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "8px" 
                }}>
                  {cat.items.map((item, i) => (
                    <li 
                      key={i} 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "10px",
                        fontSize: "0.95rem",
                        color: "#4b5563"
                      }}
                    >
                      <Check size={16} style={{ color: cat.accent, flexShrink: 0 }} />
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
