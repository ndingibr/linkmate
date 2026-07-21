import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getUserProfile, getMatches, updateMatchStatus } from "./api";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Smile, Briefcase } from "lucide-react";

export default function Matches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [connectingMatchId, setConnectingMatchId] = useState(null);
  const [connectMessage, setConnectMessage] = useState(null);
  const [mobileShowDetails, setMobileShowDetails] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/signin");
      return;
    }

    getMatches()
      .then((data) => {
        setMatches(data);
        const pendingMatches = data.filter(m => m.status !== 'rejected' && m.status !== 'converted' && m.status !== 'connected');
        if (pendingMatches.length > 0) {
          setSelectedMatch(pendingMatches[0]);
        }
      })
      .catch(err => console.error("Error loading matches:", err));

    getUserProfile()
      .then((profile) => {
        if (profile && profile.id) {
          setCurrentUserId(profile.id);
        }
      })
      .catch((err) => console.error("Error loading user profile details:", err));
  }, [navigate]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fbf7f3", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <Header />

      <style>{`
        .msg-container {
          max-width: 960px;
          margin: 0 auto;
          width: 100%;
          padding: 40px 20px;
          box-sizing: border-box;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .msg-page-title {
          font-size: 1.8rem;
          font-weight: 900;
          color: #111827;
          margin: 0 0 4px 0;
          letter-spacing: -0.025em;
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
        }
        .msg-page-sub {
          font-size: 0.95rem;
          color: #6b7280;
          margin: 0 0 24px 0;
          text-align: left;
        }

        /* LinkedIn-style Layout: Chat (Left) & Contacts (Right) */
        .msg-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          background: #ffffff;
          border: 1px solid #f3f4f6;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          min-height: 600px;
          height: 650px;
        }

        /* ─── LEFT PANEL: ACTIVE CHAT SCREEN ─── */
        .chat-panel {
          display: flex;
          flex-direction: column;
          border-right: 1px solid #f3f4f6;
          height: 100%;
          overflow: hidden;
          background: #ffffff;
        }

        .chat-header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid #e5e7eb;
          padding: 18px 24px;
          background: #ffffff;
          text-align: left;
        }
        .chat-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
        }
        .chat-header-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f17c13 0%, #ffedd5 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.5rem;
          overflow: hidden;
          flex-shrink: 0;
        }
        .chat-header-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .chat-header-info {
          min-width: 0;
          text-align: left;
        }
        .chat-header-info h3 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
        }
        .chat-header-info p {
          font-size: 0.85rem;
          color: #4b5563;
          margin: 4px 0 0 0;
          line-height: 1.3;
        }
        .chat-header-badge {
          background: #fffbeb;
          color: #d97706;
          font-weight: 750;
          font-size: 0.8rem;
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid #fef3c7;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .mobile-only-badge {
          display: none !important;
        }
        .desktop-only-badge {
          display: block !important;
        }

        /* ─── RIGHT PANEL: CONTACTS SIDEBAR LIST ─── */
        .contacts-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          background: #fcfbfa;
        }
        .contacts-header {
          padding: 18px 24px;
          font-size: 0.95rem;
          font-weight: 800;
          color: #111827;
          border-bottom: 1px solid #f3f4f6;
          text-align: left;
          background: #ffffff;
        }
        .contacts-items {
          flex: 1;
          overflow-y: auto;
        }

        /* Contact list item styled premium */
        .contact-item {
          display: flex;
          flex-direction: column;
          padding: 16px 20px;
          border-bottom: 1px solid #f9f8f6;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          position: relative;
        }
        .contact-item:hover {
          background: #fdfaf6;
        }
        .contact-item.selected {
          background: #fff7ed;
          border-left: 4px solid #f17c13;
          padding-left: 16px;
        }
        
        .contact-avatar-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .contact-avatar {
          width: 38px;
          height: 38px;
          borderRadius: 50%;
          background: linear-gradient(135deg, #f17c13 0%, #ffedd5 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.85rem;
          overflow: hidden;
          flex-shrink: 0;
        }
        .contact-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .contact-name {
          font-weight: 800;
          font-size: 0.9rem;
          color: #111827;
        }
        .contact-company {
          font-size: 0.75rem;
          color: #f17c13;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 200px;
        }
        .contact-snippet {
          font-size: 0.8rem;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-top: 4px;
        }

        .ps-btn-primary {
          background: #f17c13;
          color: #ffffff;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background 0.15s;
        }
        .ps-btn-primary:hover {
          background: #d96a0a;
        }
        .ps-btn-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .ps-btn-secondary {
          background: transparent;
          color: #ef4444;
          border: 1px solid #fecaca;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background 0.15s;
        }
        .ps-btn-secondary:hover {
          background: #fef2f2;
        }

        @media (max-width: 768px) {
          .msg-layout {
            grid-template-columns: 1fr;
            height: 580px;
            min-height: unset;
            border-radius: 12px;
          }
          .mobile-hide {
            display: none !important;
          }
          .mobile-show {
            display: flex !important;
            flex-direction: column;
            height: 100% !important;
          }
          .contacts-panel {
            border-top: none;
            height: 100% !important;
          }
          .mobile-back-btn {
            display: flex !important;
          }
          .chat-header-container {
            padding: 12px 14px;
            gap: 10px;
            flex-wrap: nowrap;
          }
          .chat-header-left {
            gap: 10px;
            flex: 1;
            min-width: 0;
          }
          .chat-header-avatar {
            width: 44px;
            height: 44px;
            font-size: 1.1rem;
          }
          .chat-header-info h3 {
            font-size: 0.95rem;
          }
          .chat-header-info p {
            font-size: 0.75rem;
          }
          .chat-header-badge {
            font-size: 0.7rem;
            padding: 4px 8px;
          }
          .mobile-only-badge {
            display: inline-block !important;
            margin-top: 6px;
            align-self: flex-start;
          }
          .desktop-only-badge {
            display: none !important;
          }
        }
      `}</style>

      <div className="msg-container">
        <h1 className="msg-page-title">
          <Briefcase size={32} style={{ color: "#f17c13" }} />
          Matches
        </h1>
        <p className="msg-page-sub">
          Review your South African B2B synergy matches and establish mutual connections.
        </p>

        <div className="msg-layout">
          {/* LEFT PANEL: MATCH SYNERGY DETAILS */}
          <div className={`chat-panel ${mobileShowDetails ? "mobile-show" : "mobile-hide"}`}>
            {selectedMatch ? (() => {
              const hasAccepted = (currentUserId === selectedMatch.user_id_1 && selectedMatch.status === "accepted_1") ||
                                  (currentUserId === selectedMatch.user_id_2 && selectedMatch.status === "accepted_2");
              return (
                <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
                  {/* Header card formatted with avatar and details */}
                  <div className="chat-header-container">
                    <div className="chat-header-left">
                      {/* Back button visible only on mobile */}
                      <button
                        type="button"
                        className="mobile-back-btn"
                        onClick={() => setMobileShowDetails(false)}
                        style={{
                          display: "none",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#f17c13",
                          padding: "4px 4px 4px 0",
                          marginRight: "4px"
                        }}
                      >
                        <span style={{ fontSize: "1.5rem", fontWeight: "900" }}>←</span>
                      </button>
                      <div className="chat-header-avatar">
                        {selectedMatch.partner.photo ? (
                          <img src={selectedMatch.partner.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          selectedMatch.partner.first_name ? selectedMatch.partner.first_name[0].toUpperCase() : "?"
                        )}
                      </div>
                      <div className="chat-header-info">
                        <h3>
                          {selectedMatch.partner.first_name} {selectedMatch.partner.last_name}
                        </h3>
                        <p style={{ margin: "2px 0 0 0" }}>
                          {selectedMatch.partner.role || "Business Friend"} @ <strong>{selectedMatch.partner.company_name || "N/A"}</strong>
                        </p>
                        {/* Mobile-only Compatibility Badge */}
                        <div className="chat-header-badge mobile-only-badge">
                          {Math.round(selectedMatch.score)}% Compatibility
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop-only Badge */}
                    <div className="chat-header-badge desktop-only-badge">
                      {Math.round(selectedMatch.score)}% Compatibility
                    </div>
                  </div>

                  {/* Scrollable details wrapper */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px", boxSizing: "border-box" }}>

                    {/* Intention statement */}
                    <div>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "#374151", fontWeight: "700" }}>Partner Intention</h4>
                      <div style={{ 
                        padding: "16px", 
                        background: "#fafafb", 
                        borderRadius: "12px", 
                        border: "1px solid #e5e7eb", 
                        fontSize: "0.9rem", 
                        color: "#111827", 
                        lineHeight: 1.5,
                        whiteSpace: "pre-line",
                        textAlign: "left"
                      }}>
                        "{selectedMatch.partner.intent}"
                      </div>
                    </div>

                    {/* Synergy reasoning */}
                    <div>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "#374151", fontWeight: "700" }}>Why You Matched</h4>
                      <div style={{ 
                        padding: "16px", 
                        background: "#fdfaf6", 
                        borderRadius: "12px", 
                        border: "1px solid #eddcd2", 
                        fontSize: "0.875rem", 
                        color: "#4b5563", 
                        lineHeight: 1.5,
                        textAlign: "left"
                      }}>
                        {selectedMatch.match_reason}
                      </div>
                    </div>

                    {/* Connection Status Message Banner */}
                    {connectMessage && (
                      <div style={{
                        marginTop: "16px",
                        padding: "12px 18px",
                        borderRadius: "8px",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: connectMessage.type === "success" ? "#ecfdf5" : "#fdfaf6",
                        border: connectMessage.type === "success" ? "1px solid #a7f3d0" : "1px solid #eddcd2",
                        color: connectMessage.type === "success" ? "#047857" : "#d97706"
                      }}>
                        {connectMessage.text}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "16px" }}>
                      {hasAccepted ? (
                        <div style={{
                          background: "#fdfaf6",
                          border: "1px solid #eddcd2",
                          color: "#d97706",
                          padding: "10px 20px",
                          borderRadius: "10px",
                          fontSize: "0.9rem",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}>
                          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#f17c13" }}></span>
                          Awaiting partner authorization...
                        </div>
                      ) : (
                        <button 
                          type="button" 
                          className="ps-btn-primary" 
                          style={{ padding: "12px 28px", borderRadius: "12px", width: "auto" }}
                          disabled={connectingMatchId === selectedMatch.id}
                          onClick={() => {
                            setConnectingMatchId(selectedMatch.id);
                            setConnectMessage(null);
                            
                            updateMatchStatus(selectedMatch.id, "accept")
                              .then((res) => {
                                getMatches().then((latestMatches) => {
                                  setMatches(latestMatches);
                                  window.dispatchEvent(new CustomEvent("refreshHeaderCounts"));
                                  const status = res.status;
                                  
                                  if (status === "connected") {
                                    setConnectMessage({ type: "success", text: "🎉 It's a Match! You are now connected." });
                                    // Navigate to next unconnected match after 2.5 seconds
                                    setTimeout(() => {
                                      const remaining = latestMatches.filter(m => m.id !== selectedMatch.id && m.status !== 'connected' && m.status !== 'rejected');
                                      const next = remaining[0] || null;
                                      setSelectedMatch(next);
                                      setConnectingMatchId(null);
                                      setConnectMessage(null);
                                    }, 2500);
                                  } else {
                                    setConnectMessage({ type: "info", text: "Awaiting partner authorization..." });
                                    const updated = latestMatches.find(m => m.id === selectedMatch.id);
                                    if (updated) {
                                      setSelectedMatch(updated);
                                    }
                                    setConnectingMatchId(null);
                                  }
                                });
                              })
                              .catch(err => {
                                console.error("Error accepting match:", err);
                                setConnectingMatchId(null);
                              });
                          }}
                        >
                          {connectingMatchId === selectedMatch.id ? "Connecting..." : "Connect"}
                        </button>
                      )}
                      <button 
                        type="button" 
                        className="ps-btn-secondary" 
                        style={{ padding: "12px 24px", borderRadius: "12px", width: "auto", color: "#ef4444", borderColor: "#fecaca" }}
                        disabled={connectingMatchId === selectedMatch.id}
                        onClick={() => {
                          if (window.confirm("Are you sure you want to ignore this partner match?")) {
                            updateMatchStatus(selectedMatch.id, "reject")
                              .then(() => {
                                getMatches().then((latestMatches) => {
                                  setMatches(latestMatches);
                                  window.dispatchEvent(new CustomEvent("refreshHeaderCounts"));
                                });
                                setSelectedMatch(null);
                              })
                              .catch(err => console.error(err));
                          }
                        }}
                      >
                        Decline match
                      </button>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="chat-panel" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: "40px", color: "#6b7280" }}>
                Select a match to view details.
              </div>
            )}
          </div>

          {/* RIGHT PANEL: NEW PARTNER MATCHES SIDEBAR LIST */}
          <div className={`contacts-panel ${mobileShowDetails ? "mobile-hide" : "mobile-show"}`}>
            <div className="contacts-header">
              New Matches
            </div>
            <div className="contacts-items">
              {(() => {
                const pendingMatches = matches.filter(m => m.status !== 'rejected' && m.status !== 'converted' && m.status !== 'connected');
                return pendingMatches.length === 0 ? (
                  <div style={{ 
                    margin: "20px 16px",
                    padding: "32px 16px", 
                    color: "#6b7280", 
                    textAlign: "center", 
                    border: "1px dashed #e5e7eb", 
                    borderRadius: "12px", 
                    background: "#fafafb" 
                  }}>
                    <Smile size={28} style={{ color: "#9ca3af", marginBottom: "8px", opacity: 0.7 }} />
                    <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#374151" }}>No matches yet</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "4px", lineHeight: 1.4 }}>
                      Try updating your intention text to trigger new AI matches.
                    </div>
                  </div>
                ) : (
                  pendingMatches.map((m) => {
                    const isSelected = selectedMatch && selectedMatch.id === m.id;
                    const initial = m.partner.first_name ? m.partner.first_name[0].toUpperCase() : "?";
                    
                    const userHasAccepted = (currentUserId === m.user_id_1 && m.status === "accepted_1") ||
                                            (currentUserId === m.user_id_2 && m.status === "accepted_2");
                    
                    return (
                      <div
                        key={m.id}
                        className={`contact-item ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedMatch(m);
                          setMobileShowDetails(true);
                        }}
                        style={{ position: "relative" }}
                      >
                        {userHasAccepted ? (
                          <span style={{
                            position: "absolute",
                            top: "14px",
                            right: "16px",
                            background: "#fafafb",
                            color: "#f17c13",
                            fontSize: "0.68rem",
                            fontWeight: "750",
                            padding: "3px 8px",
                            borderRadius: "10px",
                            border: "1px solid #eddcd2"
                          }}>
                            Pending
                          </span>
                        ) : (
                          <span style={{
                            position: "absolute",
                            top: "14px",
                            right: "16px",
                            background: "#fffbeb",
                            color: "#d97706",
                            fontSize: "0.7rem",
                            fontWeight: "750",
                            padding: "3px 8px",
                            borderRadius: "10px",
                            border: "1px solid #fef3c7"
                          }}>
                            {Math.round(m.score)}% Match
                          </span>
                        )}
                        
                        <div className="contact-avatar-row">
                          <div className="contact-avatar">
                            {m.partner.photo ? (
                              <img src={m.partner.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              initial
                            )}
                          </div>
                          
                          <div>
                            <div className="contact-name">
                              {m.partner.first_name} {m.partner.last_name}
                            </div>
                            <div className="contact-company">
                              {m.partner.company_name || "Business Friend"}
                            </div>
                          </div>
                        </div>

                        <div className="contact-snippet" style={{ color: userHasAccepted ? "#9ca3af" : "#6b7280", marginTop: "2px" }}>
                          {userHasAccepted ? "Awaiting partner connection..." : (m.partner.role || "Complementary Intent")}
                        </div>
                      </div>
                    );
                  })
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
