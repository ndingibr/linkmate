import React, { useState } from "react";
import { submitContact } from "./api";
import { Mail, ShieldCheck, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function ContactSection() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      await submitContact({
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone || null,
        message: form.message,
      });
      setStatus("success");
      setForm({ firstName: "", lastName: "", email: "", phone: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err?.response?.data?.detail || "Something went wrong. Please try again."
      );
    }
  };

  return (
    <div
      className="form-card-premium"
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "24px",
        padding: "2.5rem 2.2rem",
        border: "1px solid #e5e7eb",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box"
      }}
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.3fr",
        gap: "32px",
        alignItems: "start"
      }} className="contact-grid-wrapper">

        <style>{`
          @media (max-width: 850px) {
            .contact-grid-wrapper {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        {/* LEFT COLUMN: CLEVER DIGITAL DESK CARDS (NO FAKE ADDRESS/PHONE) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#35453f", margin: "0 0 8px 0" }}>
              Let's establish business connections
            </h3>
            <p style={{ color: "#4b5563", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>
              Whether you want to source key capabilities, list your supply offerings, or configure automated match alerts, our desk is ready to partner with you.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Digital Desk Card */}
            <div style={{
              background: "#f8fafc",
              borderRadius: "18px",
              padding: "1.2rem 1.4rem",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "16px"
            }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(236, 94, 59, 0.12)", color: "#ec5e3b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: "0.88rem", fontWeight: "700", color: "#35453f", margin: "0 0 2px 0" }}>Digital-First Desk</h4>
                <p style={{ fontSize: "0.82rem", color: "#6b7280", margin: 0 }}>Sandton & Remote, South Africa</p>
              </div>
            </div>

            {/* Rapid Response Desk Card */}
            <div style={{
              background: "#f8fafc",
              borderRadius: "18px",
              padding: "1.2rem 1.4rem",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "16px"
            }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(236, 94, 59, 0.12)", color: "#ec5e3b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Clock size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: "0.88rem", fontWeight: "700", color: "#35453f", margin: "0 0 2px 0" }}>Rapid Response Desk</h4>
                <p style={{ fontSize: "0.82rem", color: "#ec5e3b", margin: 0, fontWeight: "600" }}>Reviewed within 2 business hours</p>
              </div>
            </div>

            {/* Email Card */}
            <div style={{
              background: "#f8fafc",
              borderRadius: "18px",
              padding: "1.2rem 1.4rem",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "16px"
            }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(236, 94, 59, 0.12)", color: "#ec5e3b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Mail size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: "0.88rem", fontWeight: "700", color: "#35453f", margin: "0 0 2px 0" }}>General Inquiries</h4>
                <p style={{ fontSize: "0.82rem", color: "#ec5e3b", margin: 0, fontWeight: "600" }}>contact@smallcircles.co.za</p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CONTACT FORM */}
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#35453f", margin: "0 0 20px 0" }}>
            Send Us A Message
          </h3>

          {status === "success" && (
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", color: "#166534", padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", fontSize: "0.88rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={18} /> Thank you! Your message was submitted successfully.
            </div>
          )}

          {status === "error" && (
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", fontSize: "0.88rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={18} /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            
            <div style={{ display: "flex", gap: "16px" }} className="form-row-premium">
              <div className="input-group-premium" style={{ flex: 1 }}>
                <label className="input-label-premium">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="John"
                  className="input-premium"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group-premium" style={{ flex: 1 }}>
                <label className="input-label-premium">Surname *</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Doe"
                  className="input-premium"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group-premium">
              <label className="input-label-premium">Email Address *</label>
              <input
                type="email"
                name="email"
                placeholder="john@example.com"
                className="input-premium"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group-premium">
              <label className="input-label-premium">Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="+27 82 123 4567"
                className="input-premium"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div className="input-group-premium">
              <label className="input-label-premium">Your Message *</label>
              <textarea
                name="message"
                rows={4}
                placeholder="Tell us about your project, timeline, and goals..."
                className="input-premium"
                value={form.message}
                onChange={handleChange}
                required
              />
            </div>

            {/* FAR RIGHT COMPACT ACTION BUTTON */}
            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
              <button
                type="submit"
                disabled={status === "loading"}
                style={{
                  backgroundColor: "#ec5e3b",
                  color: "#ffffff",
                  border: "none",
                  padding: "14px 44px",
                  borderRadius: "30px",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(236, 94, 59, 0.35)",
                  width: "auto",
                  minWidth: "180px"
                }}
              >
                {status === "loading" ? "Sending..." : "Send Message"}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
