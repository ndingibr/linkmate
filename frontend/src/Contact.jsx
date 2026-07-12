import React, { useState } from "react";
import { submitContact } from "./api";

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
    <div className="premium-contact-section">
      <style>{`
        .premium-contact-section {
          display: flex;
          gap: 4rem;
          align-items: stretch;
          color: #ffffff;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          margin-top: 2rem;
          text-align: left;
        }
        
        @media (max-width: 991px) {
          .premium-contact-section {
            flex-direction: column;
            gap: 3rem;
          }
        }
        
        .contact-info-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 2rem;
        }
        
        .contact-intro {
          margin-bottom: 1.5rem;
        }

        .contact-intro h3 {
          font-size: 1.4rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 0.75rem 0;
          line-height: 1.3;
        }

        .contact-intro p {
          color: #9ca3af;
          font-size: 0.9rem;
          line-height: 1.5;
          margin: 0;
        }
        
        .contact-cards-container {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .contact-card-premium {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .contact-card-premium:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(241, 124, 19, 0.4);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        
        .contact-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(241, 124, 19, 0.1);
          color: #f17c13;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        
        .contact-card-premium:hover .contact-icon-box {
          background: #f17c13;
          color: #ffffff;
          box-shadow: 0 0 15px rgba(241, 124, 19, 0.4);
        }
        
        .contact-card-text h4 {
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
          color: #e5e7eb;
        }
        
        .contact-card-text p {
          font-size: 0.85rem;
          margin: 0;
          color: #9ca3af;
          line-height: 1.5;
        }
        
        .contact-card-text a {
          color: #f17c13;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .contact-card-text a:hover {
          color: #ff9d42;
        }
        
        .contact-form-premium {
          flex: 1.2;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        .contact-form-premium::before {
          content: '';
          position: absolute;
          top: -30%;
          right: -30%;
          width: 60%;
          height: 60%;
          background: radial-gradient(circle, rgba(241, 124, 19, 0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        
        .contact-form-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 1.25rem 0;
          position: relative;
          z-index: 1;
        }

        .form-group-premium {
          margin-bottom: 1.25rem;
          position: relative;
          z-index: 1;
        }
        
        .form-row-premium {
          display: flex;
          gap: 1.25rem;
          margin-bottom: 1.25rem;
        }
        
        @media (max-width: 576px) {
          .form-row-premium {
            flex-direction: column;
            gap: 1.25rem;
            margin-bottom: 0;
          }
          .form-row-premium .form-group-premium {
            margin-bottom: 1.25rem;
          }
        }
        
        .input-label-premium {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.4rem;
        }
        
        .input-premium {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          color: #ffffff;
          font-size: 0.85rem;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        
        .input-premium:focus {
          border-color: #f17c13;
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 0 3px rgba(241, 124, 19, 0.15);
        }
        
        .input-premium::placeholder {
          color: #52525b;
        }

        textarea.input-premium {
          resize: vertical;
          min-height: 120px;
        }
        
        .submit-btn-premium {
          width: 100%;
          background: linear-gradient(135deg, #f17c13 0%, #d96a0a 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border: none;
          border-radius: 10px;
          padding: 0.85rem;
          cursor: pointer;
          position: relative;
          z-index: 1;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(241, 124, 19, 0.25);
        }
        
        .submit-btn-premium:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(241, 124, 19, 0.45);
        }
        
        .submit-btn-premium:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .submit-btn-premium:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .alert-premium {
          border-radius: 10px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.5rem;
          font-weight: 500;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* LEFT COLUMN: CONTACT INFO */}
      <div className="contact-info-col">
        <div className="contact-intro">
          <h3>Let's build something exceptional together</h3>
          <p>
            Whether you want to launch a brand new AI-powered platform, scale an existing product, or consult on a strategic vision, we're ready to partner with you.
          </p>
        </div>

        <div className="contact-cards-container">
          {/* ADDRESS */}
          <div className="contact-card-premium">
            <div className="contact-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div className="contact-card-text">
              <h4>Headquarters</h4>
              <p>Mada Center 8th floor, 379 Hudson St, New York, NY 10018</p>
            </div>
          </div>

          {/* PHONE */}
          <div className="contact-card-premium">
            <div className="contact-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <div className="contact-card-text">
              <h4>Let's Talk</h4>
              <p><a href="tel:+18001236879">+1 (800) 123-6879</a></p>
            </div>
          </div>

          {/* EMAIL */}
          <div className="contact-card-premium">
            <div className="contact-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
            <div className="contact-card-text">
              <h4>General Inquiries</h4>
              <p><a href="mailto:contact@example.com">contact@example.com</a></p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: MODERN FORM */}
      <div className="contact-form-premium">
        <h4 className="contact-form-title">Send Us A Message</h4>

        {status === "success" && (
          <div className="alert-premium" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
            <span>✅</span>
            <span>Thank you! Your message was submitted successfully.</span>
          </div>
        )}

        {status === "error" && (
          <div className="alert-premium" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            <span>❌</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row-premium">
            <div className="form-group-premium" style={{ flex: 1 }}>
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
            <div className="form-group-premium" style={{ flex: 1 }}>
              <label className="input-label-premium">Last Name *</label>
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

          <div className="form-group-premium">
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

          <div className="form-group-premium">
            <label className="input-label-premium">Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="+1 (555) 000-0000"
              className="input-premium"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group-premium">
            <label className="input-label-premium">Your Message *</label>
            <textarea
              name="message"
              placeholder="Tell us about your project, timeline, and goals..."
              className="input-premium"
              value={form.message}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="submit-btn-premium" disabled={status === "loading"}>
            {status === "loading" ? "Sending Message..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}
