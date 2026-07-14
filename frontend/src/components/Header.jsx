import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, logout, getUserProfile, getInboxMessages } from "../api";
import logoImg from "../img/ventureai_logo.jpg";
import { Menu, X, MessageSquare } from "lucide-react";

export default function Header({ profileOverride }) {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(false);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkAuth = isAuthenticated();
    setAuth(checkAuth);
    if (checkAuth) {
      if (!profileOverride) {
        getUserProfile()
          .then((data) => setProfile(data))
          .catch((err) => console.error("Header profile fetch failed:", err));
      }
      // Fetch inbox messages to count unread ones
      getInboxMessages()
        .then((msgs) => {
          if (Array.isArray(msgs)) {
            const count = msgs.filter(m => !m.is_read).length;
            setUnreadCount(count);
          }
        })
        .catch((err) => console.error("Header inbox fetch failed:", err));
    }
  }, [profileOverride]);

  const currentProfile = profileOverride || profile;
  const currentPhoto = currentProfile?.photo;
  const initial = currentProfile?.first_name ? currentProfile.first_name[0].toUpperCase() : "?";

  const handleLogout = () => {
    logout();
    setAuth(false);
    setMenuOpen(false);
    navigate("/login");
  };

  return (
    <nav className="main-nav-header">
      <div className="main-nav-container">
      {/* Logo */}
      <div onClick={() => navigate("/")} className="main-nav-logo" style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
        <img
          src={logoImg}
          alt="LinkMate Logo"
          style={{
            height: "35px",
            width: "35px",
            borderRadius: "8px",
            objectFit: "cover",
          }}
        />
        <span style={{ color: "#f17c13", fontWeight: "800", fontSize: "1.5rem", letterSpacing: "-0.03em" }}>
          link<span style={{ color: "#111827" }}>mate</span>
        </span>
      </div>

      {/* Mobile Hamburger Toggle */}
      <button className="main-nav-toggle-btn" style={{ color: "#4b5563" }} onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Navigation Links */}
      <div className={`main-nav-items-wrapper ${menuOpen ? "open" : ""}`}>
        <span
          onClick={() => {
            navigate("/");
            setMenuOpen(false);
          }}
          style={{
            cursor: "pointer",
            color: "#4b5563",
            fontWeight: "600",
            fontSize: "0.95rem",
            transition: "color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#f17c13"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#4b5563"}
        >
          Home
        </span>

        <a
          href="#how-it-works-section"
          onClick={() => setMenuOpen(false)}
          style={{
            textDecoration: "none",
            color: "#4b5563",
            fontWeight: "600",
            fontSize: "0.95rem",
            transition: "color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#f17c13"}
          onMouseLeave={(e) => e.currentTarget.style.color = "#4b5563"}
        >
          About Us
        </a>

        {auth && (
          <span
            onClick={() => {
              navigate("/messages");
              setMenuOpen(false);
            }}
            style={{
              cursor: "pointer",
              color: "#4b5563",
              fontWeight: "600",
              fontSize: "0.95rem",
              transition: "color 0.2s",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px"
            }}
            title="Messages"
            onMouseEnter={(e) => e.currentTarget.style.color = "#f17c13"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#4b5563"}
          >
            <MessageSquare size={20} />
            {unreadCount > 0 && (
              <span style={{
                fontSize: "0.7rem",
                backgroundColor: "#f17c13",
                color: "#ffffff",
                padding: "2px 6px",
                borderRadius: "10px",
                lineHeight: 1,
                fontWeight: "700"
              }}>
                {unreadCount}
              </span>
            )}
          </span>
        )}

        <div className="main-nav-auth-group">
          {auth ? (
            <>
              {/* Circular Avatar Icon containing initial or photo */}
              <div
                onClick={() => {
                  navigate("/profile");
                  setMenuOpen(false);
                }}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  backgroundColor: "#f17c13",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "1.05rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(241,124,19,0.25)",
                  border: "2px solid #f17c13",
                  transition: "transform 0.15s ease",
                  overflow: "hidden"
                }}
                title="View Profile"
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt="User Avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  initial
                )}
              </div>

              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: "rgba(241, 124, 19, 0.1)",
                  color: "#f17c13",
                  border: "none",
                  padding: "0.5rem 1.2rem",
                  borderRadius: "20px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  marginLeft: "8px",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(241, 124, 19, 0.15)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(241, 124, 19, 0.1)"}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  navigate("/login");
                  setMenuOpen(false);
                }}
                style={{
                  backgroundColor: "transparent",
                  color: "#4b5563",
                  border: "1px solid #d1d5db",
                  padding: "0.5rem 1.2rem",
                  borderRadius: "20px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                  e.currentTarget.style.borderColor = "#9ca3af";
                  e.currentTarget.style.color = "#111827";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "#d1d5db";
                  e.currentTarget.style.color = "#4b5563";
                }}
              >
                Login
              </button>
              <button
                onClick={() => {
                  navigate("/register");
                  setMenuOpen(false);
                }}
                style={{
                  backgroundColor: "#f17c13",
                  color: "#ffffff",
                  border: "none",
                  padding: "0.5rem 1.2rem",
                  borderRadius: "20px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  marginLeft: "8px",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#d96a0a"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f17c13"}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
      </div>
    </nav>
  );
}
