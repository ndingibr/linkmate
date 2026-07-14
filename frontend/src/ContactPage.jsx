import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "./img/ventureai_logo.jpg";
import { Menu, X } from "lucide-react";
import { isAuthenticated, logout } from "./api";
import ContactSection from "./Contact";
import Footer from "./components/Footer";
import Header from "./components/Header";

export default function ContactPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fbf7f3", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Reusable Header Navigation */}
      <Header />

      {/* Main Spacer */}
      <div style={{ flex: 1, backgroundColor: "#fbf7f3" }} />

      {/* Contact Form Section */}
      <section
        id="contact"
        style={{
          backgroundColor: "#111111",
          borderTop: "1px solid #2a2a2a",
          padding: "80px 0",
          width: "100%"
        }}
      >
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
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
              Get In Touch
            </span>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "#ffffff",
                marginTop: "0.5rem",
              }}
            >
              Contact Us
            </h2>
            <p style={{ color: "#9ca3af", maxWidth: "520px", margin: "0 auto" }}>
              Have questions about integrating LinkMate into your workflow? Contact our partnership desk.
            </p>
          </div>
          <ContactSection />
        </div>
      </section>

      {/* Reusable Copyright Footer */}
      <Footer />
    </div>
  );
}
