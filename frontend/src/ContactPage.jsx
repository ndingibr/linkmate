import React from "react";
import ContactSection from "./Contact";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { CheckCircle } from "lucide-react";

export default function ContactPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#eef1f6", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Reusable Header Navigation */}
      <Header />

      {/* Main Contact Content Section */}
      <main style={{ flex: 1, padding: "36px 20px 60px 20px", backgroundColor: "#eef1f6" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* ════ HERO HEADER BANNER CARD (SWATCH COLOR #eef1f6) ════ */}
          <div style={{
            backgroundColor: "#eef1f6",
            borderRadius: "24px",
            padding: "2.2rem 2.2rem",
            color: "#1f2937",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
            border: "1px solid #d1d5db",
            width: "100%",
            boxSizing: "border-box"
          }}>
            <div style={{ color: "#ec5e3b", fontWeight: "800", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle size={14} /> Get In Touch
            </div>

            <h1 style={{ fontSize: "2.1rem", fontWeight: "800", color: "#35453f", margin: "0 0 8px 0", letterSpacing: "-0.02em" }}>
              Contact Us
            </h1>

            <p style={{ color: "#4b5563", fontSize: "0.95rem", margin: 0, fontWeight: "500", lineHeight: "1.5", maxWidth: "820px" }}>
              Have questions about integrating Small Circles into your workflow? Contact our partnership desk.
            </p>
          </div>

          {/* Embedded Contact Section inside White Card Pane */}
          <ContactSection />
        </div>
      </main>

      {/* Reusable Copyright Footer */}
      <Footer />
    </div>
  );
}
