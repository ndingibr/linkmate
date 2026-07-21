import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated, logout, getUserProfile, getInboxMessages, getMatches } from "../api";
import { Search, HelpCircle, LogOut, Home, Briefcase, MessageSquare, User, Menu, X } from "lucide-react";

export default function Header({ profileOverride }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [auth, setAuth] = useState(false);
  const [profile, setProfile] = useState(null);
  const [unreadCount, setUnreadCount] = useState(() => {
    return Number(sessionStorage.getItem("linkmate_unread_count") || 0);
  });
  const [pendingMatchesCount, setPendingMatchesCount] = useState(() => {
    return Number(sessionStorage.getItem("linkmate_pending_matches_count") || 0);
  });
  const [meMenuOpen, setMeMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const refreshCounts = () => {
    if (isAuthenticated()) {
      getInboxMessages()
        .then((msgs) => {
          if (Array.isArray(msgs)) {
            const count = msgs.filter(m => !m.is_read).length;
            setUnreadCount(count);
            sessionStorage.setItem("linkmate_unread_count", count);
          }
        })
        .catch((err) => console.error("Header inbox fetch failed:", err));

      getMatches()
        .then((mList) => {
          if (Array.isArray(mList)) {
            getUserProfile().then((usr) => {
              const pendingMatches = mList.filter(m => {
                const hasActioned = (m.status === "connected") || 
                                    (m.status === "rejected") || 
                                    (m.status === "converted") ||
                                    (usr.id === m.user_id_1 && m.status === "accepted_1") ||
                                    (usr.id === m.user_id_2 && m.status === "accepted_2");
                return !hasActioned;
              });
              setPendingMatchesCount(pendingMatches.length);
              sessionStorage.setItem("linkmate_pending_matches_count", pendingMatches.length);
            }).catch(() => {});
          }
        })
        .catch((err) => console.error("Header matches fetch failed:", err));
    }
  };

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
      refreshCounts();
    }
  }, [profileOverride, location.pathname]);

  useEffect(() => {
    window.addEventListener("refreshHeaderCounts", refreshCounts);
    return () => window.removeEventListener("refreshHeaderCounts", refreshCounts);
  }, []);

  useEffect(() => {
    const handleOutsideClick = () => setMeMenuOpen(false);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const currentProfile = profileOverride || profile;
  const currentPhoto = currentProfile?.photo;
  const initial = currentProfile?.first_name ? currentProfile.first_name[0].toUpperCase() : "?";

  const handleMeClick = (e) => {
    e.stopPropagation();
    setMeMenuOpen(!meMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setAuth(false);
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Simulate search or go to profiles search filter
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const currentPath = location.pathname;
  const isHome = currentPath === "/";
  const isMessages = currentPath === "/messages";
  const isMatches = currentPath === "/matches";
  const isProfile = currentPath.startsWith("/profile");

  return (
    <>
      <style>{`
        /* Header Container Styles */
        .professional-header {
          position: sticky;
          top: 0;
          background: #f3f4f6;
          border-bottom: 1px solid #d1d5db;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          width: 100%;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
          z-index: 1000;
        }

        .header-top-row {
          width: 100%;
          max-width: 1060px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 24px;
          box-sizing: border-box;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1;
        }

        .logo-text-small {
          color: #35453f;
          font-size: 1.1rem;
          font-weight: 550;
          letter-spacing: -0.02em;
        }

        .logo-text-circles {
          color: #35453f;
          font-size: 1.1rem;
          font-weight: 550;
          letter-spacing: -0.02em;
        }

        /* Search input bar */
        .search-bar-form {
          display: flex;
          align-items: center;
          position: relative;
          width: 280px;
          margin-left: 20px;
          margin-right: auto;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px 8px 36px;
          border-radius: 20px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          font-size: 0.85rem;
          color: #374151;
          outline: none;
          transition: all 0.15s ease;
        }

        .search-input:focus {
          border-color: #d0533c;
          box-shadow: 0 0 0 2px rgba(208, 83, 60, 0.1);
        }

        .search-icon-wrapper {
          position: absolute;
          left: 12px;
          color: #9ca3af;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        /* ProfileDropdown */
        .profile-trigger-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #d1d5db;
          padding: 6px 14px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          color: #374151;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }

        .profile-trigger-btn:hover {
          background: #f9fafb;
          border-color: #b9bec5;
        }

        .profile-avatar-circle {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          overflow: hidden;
          background: #ec5e3b;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.8rem;
          border: 1px solid #e5e7eb;
        }

        .profile-avatar-circle img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Bottom Row Menu */
        .header-bottom-row {
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .bottom-row-content {
          width: 100%;
          max-width: 1060px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0 24px;
          box-sizing: border-box;
          height: 42px;
          position: relative;
        }

        .nav-links-list {
          display: flex;
          align-items: center;
          height: 100%;
        }

        .nav-divider-pipe {
          width: 1px;
          height: 14px;
          background-color: #d1d5db;
          margin: 0 4px;
        }

        .nav-tab-item {
          color: #4b5563;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
          position: relative;
        }

        .nav-tab-item:hover {
          color: #ec5e3b;
          background: rgba(236, 94, 59, 0.05);
        }

        .nav-tab-item.active {
          color: #ec5e3b;
          font-weight: 750;
        }

        .right-helper-links {
          display: flex;
          align-items: center;
          gap: 16px;
          position: absolute;
          right: 24px;
          width: 200px;
          justify-content: flex-start;
        }

        .helper-link-btn {
          font-size: 0.85rem;
          font-weight: 600;
          color: #4b5563;
          text-decoration: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: color 0.15s;
          background: none;
          border: none;
          padding: 0;
        }

        .helper-link-btn:hover {
          color: #ec5e3b;
        }

        /* Unread Badge Counter */
        .tab-badge-counter {
          background-color: #ef4444;
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 8px;
          line-height: 1.2;
          margin-left: 2px;
        }

        /* Dropdown Menu block */
        .me-dropdown-menu {
          position: absolute;
          top: 42px;
          left: 0;
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          min-width: 140px;
          display: flex;
          flex-direction: column;
          padding: 4px 0;
          z-index: 1100;
        }

        .dropdown-item-link {
          padding: 10px 16px;
          cursor: pointer;
          font-size: 0.85rem;
          color: #374151;
          font-weight: 600;
          transition: background-color 0.15s;
          text-align: left;
        }

        .dropdown-item-link:hover {
          background-color: #f3f4f6;
        }

        .dropdown-item-link.sign-out {
          color: #ef4444;
          border-top: 1px solid #f3f4f6;
        }

        .profile-trigger-wrapper {
          display: flex;
          justify-content: flex-start;
          width: 200px;
          position: relative;
        }

        /* Mobile Styles */
        @media (max-width: 768px) {
          .profile-trigger-wrapper {
            width: auto !important;
          }
          .mobile-menu-toggle {
            display: flex !important;
          }
          .search-bar-form {
            display: none;
          }
          .header-bottom-row {
            display: none;
            width: 100%;
            background: #ffffff;
            border-top: 1px solid #e5e7eb;
          }
          .header-bottom-row.mobile-open {
            display: block !important;
          }
          .bottom-row-content {
            flex-direction: column !important;
            height: auto !important;
            padding: 12px 24px !important;
            align-items: stretch !important;
          }
          .nav-links-list {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100%;
            height: auto !important;
          }
          .nav-divider-pipe {
            display: none !important;
          }
          .nav-tab-item {
            padding: 10px 16px !important;
            border-radius: 8px;
            margin-bottom: 4px;
            font-size: 0.95rem !important;
          }
          .right-helper-links {
            position: static !important;
            width: 100% !important;
            flex-direction: column !important;
            align-items: stretch !important;
            border-top: 1px solid #f3f4f6;
            margin-top: 8px;
            padding-top: 12px;
            gap: 4px !important;
          }
          .helper-link-btn {
            padding: 10px 16px !important;
            font-size: 0.95rem !important;
            width: 100%;
          }
          .mobile-bottom-nav-bar {
            display: none !important;
          }
        }
      `}</style>

      <header className="professional-header">
        <div className="header-top-row">
          {/* Logo with interlinked circles */}
          <div className="logo-container" onClick={() => navigate("/")}>
            <svg width="40" height="40" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Three overlapping circles (Venn diagram layout) */}
              <circle cx="25" cy="18" r="11" stroke="#b0a296" strokeWidth="2.5" fill="none" />
              <circle cx="17" cy="31" r="11" stroke="#b0a296" strokeWidth="2.5" fill="none" />
              <circle cx="33" cy="31" r="11" stroke="#b0a296" strokeWidth="2.5" fill="none" />
            </svg>
            <div className="logo-text">
              <span className="logo-text-small">small</span>
              <span className="logo-text-circles">circles</span>
            </div>
          </div>



          {/* User profile / dropdown */}
          {auth ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="profile-trigger-wrapper">
                <div className="profile-trigger-btn" onClick={handleMeClick}>
                  <div className="profile-avatar-circle">
                    {currentPhoto ? (
                      <img src={currentPhoto} alt="" />
                    ) : (
                      initial
                    )}
                  </div>
                  <span>My Circles ▾</span>
                </div>
                
                {meMenuOpen && (
                  <div className="me-dropdown-menu">
                    <div className="dropdown-item-link" onClick={() => navigate("/profile")}>
                      View Profile
                    </div>
                    <div className="dropdown-item-link" onClick={() => navigate("/matches")}>
                      My Matches
                    </div>
                    <div className="dropdown-item-link sign-out" onClick={handleLogout}>
                      Sign Out
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Hamburger Menu Toggle */}
              <button 
                className="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#35453f",
                  cursor: "pointer",
                  display: "none",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px"
                }}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={() => navigate("/login")}
                style={{
                  background: "transparent",
                  color: "#ec5e3b",
                  border: "1px solid #ec5e3b",
                  padding: "6px 16px",
                  borderRadius: "20px",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                Sign In
              </button>
              
              <button
                onClick={() => navigate("/register")}
                style={{
                  background: "#ec5e3b",
                  color: "#ffffff",
                  border: "none",
                  padding: "6px 16px",
                  borderRadius: "20px",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(236, 94, 59, 0.15)",
                  transition: "all 0.2s ease"
                }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Bottom row navigation items */}
        {auth && (
          <div className={`header-bottom-row ${mobileMenuOpen ? "mobile-open" : ""}`}>
            <div className="bottom-row-content">
              <nav className="nav-links-list">
                <div className={`nav-tab-item ${isMatches ? "active" : ""}`} onClick={() => navigate("/matches")}>
                  Matches
                  {pendingMatchesCount > 0 && (
                    <span className="tab-badge-counter">{pendingMatchesCount}</span>
                  )}
                </div>
                
                <div className="nav-divider-pipe"></div>

                <div className={`nav-tab-item ${isMessages ? "active" : ""}`} onClick={() => navigate("/messages")}>
                  Connections
                </div>

                <div className="nav-divider-pipe"></div>

                <div className={`nav-tab-item ${isMessages ? "active" : ""}`} onClick={() => navigate("/messages")}>
                  Messages
                  {unreadCount > 0 && (
                    <span className="tab-badge-counter">{unreadCount}</span>
                  )}
                </div>

                <div className="nav-divider-pipe"></div>

                <div className={`nav-tab-item ${isProfile ? "active" : ""}`} onClick={() => navigate("/profile")}>
                  Account
                </div>
              </nav>

              <div className="right-helper-links">
                <button className="helper-link-btn" onClick={() => navigate("/contact")}>
                  <HelpCircle size={15} />
                  <span>Help</span>
                </button>
                <button className="helper-link-btn" onClick={handleLogout}>
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
