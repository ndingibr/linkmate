import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated, logout, getUserProfile, getInboxMessages } from "../api";
import { Home, Briefcase, MessageSquare, LogOut } from "lucide-react";

export default function Header({ profileOverride }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [auth, setAuth] = useState(false);
  const [profile, setProfile] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [meMenuOpen, setMeMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = isAuthenticated();
    setAuth(checkAuth);
    if (checkAuth) {
      if (!profileOverride) {
        const cachedProfile = sessionStorage.getItem("linkmate_profile");
        if (cachedProfile) {
          try {
            setProfile(JSON.parse(cachedProfile));
          } catch (e) {
            console.error("Failed to parse cached profile:", e);
          }
        }

        getUserProfile()
          .then((data) => {
            setProfile(data);
            sessionStorage.setItem("linkmate_profile", JSON.stringify(data));
          })
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => setMeMenuOpen(false);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const currentProfile = profileOverride || profile;
  const currentPhoto = currentProfile?.photo;
  const initial = currentProfile?.first_name ? currentProfile.first_name[0].toUpperCase() : "?";

  const handleLogout = () => {
    logout();
    setAuth(false);
    navigate("/login");
  };

  const handleMeClick = (e) => {
    e.stopPropagation();
    setMeMenuOpen(!meMenuOpen);
  };

  const currentPath = location.pathname;
  const isHome = currentPath === "/";
  const isMessages = currentPath === "/messages";
  const isProfile = currentPath.startsWith("/profile");

  const navLinkStyle = (isActive) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: isActive ? "#f17c13" : "#666666",
    borderBottom: isActive ? "2px solid #f17c13" : "2px solid transparent",
    padding: "4px 8px",
    textDecoration: "none",
    fontSize: "0.74rem",
    fontWeight: "600",
    transition: "all 0.15s ease",
    minWidth: "64px",
    gap: "3px",
    boxSizing: "border-box",
    height: "56px",
    position: "relative"
  });

  const renderMeDropdown = () => {
    if (!auth) return null;
    return (
      <div style={{ position: "relative" }}>
        {/* Me Avatar trigger */}
        <div 
          onClick={handleMeClick}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: isProfile || meMenuOpen ? "#f17c13" : "#666666",
            padding: "4px 8px",
            fontSize: "0.74rem",
            fontWeight: "600",
            minWidth: "64px",
            height: "56px",
            boxSizing: "border-box",
            gap: "3px"
          }}
        >
          <div style={{
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            backgroundColor: "#f17c13",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            fontSize: "0.7rem",
            overflow: "hidden",
            border: (isProfile || meMenuOpen) ? "1.5px solid #f17c13" : "1.5px solid #e5e7eb"
          }}>
            {currentPhoto ? (
              <img src={currentPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initial
            )}
          </div>
          <span>Me ▾</span>
        </div>

        {/* Dropdown Menu */}
        {meMenuOpen && (
          <div style={{
            position: "absolute",
            top: "52px",
            right: "4px",
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            minWidth: "130px",
            display: "flex",
            flexDirection: "column",
            padding: "4px 0",
            zIndex: 1100
          }}>
            <div 
              onClick={() => {
                setMeMenuOpen(false);
                navigate("/profile");
              }}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                fontSize: "0.85rem",
                color: "#374151",
                fontWeight: "600",
                transition: "background-color 0.15s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              View Profile
            </div>
            <div 
              onClick={() => {
                setMeMenuOpen(false);
                handleLogout();
              }}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                fontSize: "0.85rem",
                color: "#ef4444",
                fontWeight: "600",
                borderTop: "1px solid #f3f4f6",
                transition: "background-color 0.15s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              Sign Out
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Top Header Bar */}
      <nav className="top-nav-bar" style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.03)",
        height: "56px"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1060px",
          margin: "0 auto",
          height: "100%",
          padding: "0 24px",
          boxSizing: "border-box"
        }}>
          {/* Logo left-aligned */}
          <div onClick={() => navigate("/")} style={{ display: "grid", gridTemplateColumns: "auto auto", gridTemplateRows: "1fr 1fr", alignItems: "center", gap: "2px 6px", cursor: "pointer" }}>
            {/* Column 1, spanning both rows */}
            <div style={{ gridColumn: "1", gridRow: "1 / span 2" }}>
              <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                <circle cx="18" cy="18" r="11" stroke="#f17c13" strokeWidth="3" fill="none" />
                <circle cx="30" cy="30" r="11" stroke="#f17c13" strokeWidth="3" fill="none" />
              </svg>
            </div>
            {/* Column 2, Row 1 */}
            <div style={{ gridColumn: "2", gridRow: "1", alignSelf: "end", lineHeight: "1" }}>
              <span style={{ color: "#f17c13", fontWeight: "900", fontSize: "1.25rem", letterSpacing: "-0.03em" }}>
                small
              </span>
            </div>
            {/* Column 2, Row 2 */}
            <div style={{ gridColumn: "2", gridRow: "2", alignSelf: "start", lineHeight: "1", marginLeft: "14px" }}>
              <span style={{ color: "#111827", fontWeight: "900", fontSize: "1.25rem", letterSpacing: "-0.03em" }}>
                circles
              </span>
            </div>
          </div>

          {/* Desktop/Wider Screens Navigation Items Wrapper */}
          <div className="desktop-nav-items" style={{ display: "flex", alignItems: "center", gap: "4px", height: "100%" }}>
            <div style={navLinkStyle(isHome)} onClick={() => navigate("/")}>
              <Home size={20} />
              <span>Home</span>
            </div>

            {auth ? (
              <>
                {/* Matches (briefcase icon) */}
                <div 
                  style={navLinkStyle(isMessages && sessionStorage.getItem("activeSidebarTab") === "matches")} 
                  onClick={() => {
                    sessionStorage.setItem("activeSidebarTab", "matches");
                    navigate("/messages");
                    if (currentPath === "/messages") {
                      window.dispatchEvent(new CustomEvent("tabChange", { detail: "matches" }));
                      window.location.reload();
                    }
                  }}
                >
                  <Briefcase size={20} />
                  <span>Matches</span>
                </div>

                {/* Messaging */}
                <div 
                  style={navLinkStyle(isMessages && sessionStorage.getItem("activeSidebarTab") !== "matches")} 
                  onClick={() => {
                    sessionStorage.setItem("activeSidebarTab", "messages");
                    navigate("/messages");
                    if (currentPath === "/messages") {
                      window.dispatchEvent(new CustomEvent("tabChange", { detail: "messages" }));
                      window.location.reload();
                    }
                  }}
                >
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <MessageSquare size={20} />
                    {unreadCount > 0 && (
                      <span style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                        fontSize: "0.65rem",
                        backgroundColor: "#ef4444",
                        color: "#ffffff",
                        padding: "1px 5px",
                        borderRadius: "8px",
                        lineHeight: 1.2,
                        fontWeight: "800"
                      }}>
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <span>Messaging</span>
                </div>

                {renderMeDropdown()}
              </>
            ) : (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={() => navigate("/register")}
                  style={{
                    backgroundColor: "transparent",
                    color: "#5e5e5e",
                    border: "none",
                    padding: "6px 16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    borderRadius: "20px",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)";
                    e.currentTarget.style.color = "#000000";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#5e5e5e";
                  }}
                >
                  Join now
                </button>
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    backgroundColor: "transparent",
                    color: "#f17c13",
                    border: "1px solid #f17c13",
                    padding: "6px 18px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    borderRadius: "20px",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(241, 124, 19, 0.04)";
                    e.currentTarget.style.borderWidth = "2px";
                    e.currentTarget.style.padding = "5px 17px";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderWidth = "1px";
                    e.currentTarget.style.padding = "6px 18px";
                  }}
                >
                  Sign in
                </button>
              </div>
            )}
          </div>

          {/* Mobile-Only Me Dropdown in the top header */}
          <div className="mobile-me-container" style={{ display: "none" }}>
            {renderMeDropdown()}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Home, Matches, Messaging only) */}
      {auth && (
        <nav className="mobile-bottom-nav-bar" style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: "#ffffff",
          borderTop: "1px solid #e5e7eb",
          boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.06)",
          height: "56px",
          display: "none",
          justifyContent: "space-around",
          alignItems: "center"
        }}>
          <div style={navLinkStyle(isHome)} onClick={() => navigate("/")}>
            <Home size={20} />
            <span>Home</span>
          </div>

          <div 
            style={navLinkStyle(isMessages && sessionStorage.getItem("activeSidebarTab") === "matches")} 
            onClick={() => {
              sessionStorage.setItem("activeSidebarTab", "matches");
              navigate("/messages");
              if (currentPath === "/messages") {
                window.dispatchEvent(new CustomEvent("tabChange", { detail: "matches" }));
                window.location.reload();
              }
            }}
          >
            <Briefcase size={20} />
            <span>Matches</span>
          </div>

          <div 
            style={navLinkStyle(isMessages && sessionStorage.getItem("activeSidebarTab") !== "matches")} 
            onClick={() => {
              sessionStorage.setItem("activeSidebarTab", "messages");
              navigate("/messages");
              if (currentPath === "/messages") {
                window.dispatchEvent(new CustomEvent("tabChange", { detail: "messages" }));
                window.location.reload();
              }
            }}
          >
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <MessageSquare size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-6px",
                  fontSize: "0.65rem",
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                  padding: "1px 5px",
                  borderRadius: "8px",
                  lineHeight: 1.2,
                  fontWeight: "800"
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <span>Messaging</span>
          </div>
        </nav>
      )}

      {/* Responsive media overrides */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav-items {
            display: none !important;
          }
          .mobile-me-container {
            display: block !important;
          }
          .mobile-bottom-nav-bar {
            display: flex !important;
          }
          body {
            padding-bottom: 56px !important;
          }
        }
      `}</style>
    </>
  );
}
