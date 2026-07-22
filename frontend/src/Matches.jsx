import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated, getUserProfile, getMatches, updateMatchStatus } from "./api";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Smile, ArrowLeft, ShieldCheck, MapPin, Building, ChevronRight, User, CheckCircle } from "lucide-react";
import execHandshakeImg from "./img/exec_handshake.jpg";

export default function Matches() {
  const navigate = useNavigate();
  const location = useLocation();

  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [viewState, setViewState] = useState("list"); // "list" or "details"
  const [connectingMatchId, setConnectingMatchId] = useState(null);
  const [connectMessage, setConnectMessage] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/signin");
      return;
    }

    getMatches()
      .then((data) => {
        setMatches(data);
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

  const activeMatches = matches.filter(m => m.status !== 'rejected' && m.status !== 'converted' && m.status !== 'connected');

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#eef1f6", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
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
          gap: 24px;
        }

        /* Match Card Item in List View */
        .match-card-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          gap: 16px;
        }
        .match-card-item:hover {
          border-color: #ec5e3b;
          box-shadow: 0 8px 24px rgba(236, 94, 59, 0.08);
          transform: translateY(-2px);
        }

        .avatar-frame {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ec5e3b 0%, #ffedd5 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.2rem;
          overflow: hidden;
          flex-shrink: 0;
        }

        /* Compact Far-Right Primary Action Button */
        .btn-action-primary {
          background: #ec5e3b;
          color: #ffffff;
          border: none;
          padding: 12px 32px;
          border-radius: 30px;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.9rem;
          box-shadow: 0 4px 14px rgba(236, 94, 59, 0.35);
          transition: background 0.15s;
          width: auto;
          min-width: 140px;
        }
        .btn-action-primary:hover {
          background: #d94e2b;
        }
        .btn-action-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .btn-action-secondary {
          background: transparent;
          color: #6b7280;
          border: 1px solid #d1d5db;
          padding: 12px 24px;
          border-radius: 30px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.88rem;
          transition: all 0.15s;
        }
        .btn-action-secondary:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          color: #35453f;
          border: 1px solid #d1d5db;
          padding: 8px 18px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.15s ease;
          width: fit-content;
        }
        .btn-back-link:hover {
          border-color: #ec5e3b;
          color: #ec5e3b;
          background: #fff7ed;
        }
      `}</style>

      <div className="msg-container">
        
        {/* ════ PERMANENT HERO HEADER BANNER (SWATCH COLOR #eef1f6 WITH 104px PICTURE) ════ */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
            
            {/* 104px Picture Frame (Matching Profile Page Avatar Size) */}
            <div style={{
              width: "104px",
              height: "104px",
              borderRadius: "50%",
              backgroundColor: "#ffffff",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3.5px solid #d1d5db",
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.08)",
              flexShrink: 0
            }}>
              <img src={execHandshakeImg} alt="Matches" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>

            {/* Header Content */}
            <div style={{ flex: 1, minWidth: "240px" }}>
              <div style={{ color: "#ec5e3b", fontWeight: "800", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle size={14} /> Matchmaker Active
              </div>

              <h1 style={{ fontSize: "2.1rem", fontWeight: "800", color: "#35453f", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
                Matches
              </h1>

              <p style={{ color: "#4b5563", fontSize: "0.95rem", margin: 0, fontWeight: "500", lineHeight: "1.5", maxWidth: "820px" }}>
                As soon as high-probability business matches happen, you will see them here in real time.
              </p>
            </div>

          </div>
        </div>

        {/* ════ VIEW 1: MATCHES LIST VIEW (INITIAL LOAD) ════ */}
        {viewState === "list" && (
          <div className="form-card-premium" style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "2rem 2.2rem", border: "1px solid #e5e7eb", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#35453f", margin: 0 }}>
                Introducible Matches
              </h2>
              <span style={{ backgroundColor: "#ec5e3b", color: "#ffffff", padding: "4px 14px", borderRadius: "16px", fontSize: "0.8rem", fontWeight: "700" }}>
                {activeMatches.length} {activeMatches.length === 1 ? "Match" : "Matches"}
              </span>
            </div>

            {activeMatches.length === 0 ? (
              <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed #d1d5db", borderRadius: "20px", background: "#f8fafc" }}>
                <Smile size={42} color="#ec5e3b" style={{ margin: "0 auto 12px", opacity: 0.8 }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#35453f", margin: "0 0 6px" }}>No Matches Available Yet</h3>
                <p style={{ color: "#6b7280", fontSize: "0.9rem", maxWidth: "460px", margin: "0 auto", lineHeight: "1.5" }}>
                  Our Matchmaker engine is actively evaluating registered intentions across South Africa. High-synergy matches will appear right here as soon as they are found.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {activeMatches.map((m) => {
                  const initial = m.partner.first_name ? m.partner.first_name[0].toUpperCase() : "?";
                  const userHasAccepted = (currentUserId === m.user_id_1 && m.status === "accepted_1") ||
                                      (currentUserId === m.user_id_2 && m.status === "accepted_2");

                  return (
                    <div
                      key={m.id}
                      className="match-card-item"
                      onClick={() => {
                        setSelectedMatch(m);
                        setViewState("details");
                        setConnectMessage(null);
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
                        <div className="avatar-frame">
                          {m.partner.photo ? (
                            <img src={m.partner.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            initial
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#1f2937", margin: 0 }}>
                              {m.partner.first_name} {m.partner.last_name}
                            </h3>
                            <span style={{ backgroundColor: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", fontSize: "0.75rem", fontWeight: "700", padding: "2px 8px", borderRadius: "12px" }}>
                              {Math.round(m.score)}% Synergy
                            </span>
                          </div>

                          <p style={{ color: "#ec5e3b", fontSize: "0.85rem", fontWeight: "600", margin: "2px 0 4px" }}>
                            {m.partner.role || "Executive Member"} {m.partner.company_name ? `• ${m.partner.company_name}` : ""}
                          </p>

                          <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            "{m.partner.intent}"
                          </p>

                          {userHasAccepted && (
                            <div style={{ fontSize: "0.78rem", color: "#c2410c", marginTop: "4px", fontWeight: "600" }}>
                              • Authorization sent — Awaiting partner confirmation
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ec5e3b", fontWeight: "700", fontSize: "0.85rem" }}>
                        View Details <ChevronRight size={18} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ════ VIEW 2: SINGLE MATCH DETAILS VIEW (ON CLICK) ════ */}
        {viewState === "details" && selectedMatch && (() => {
          const hasAccepted = (currentUserId === selectedMatch.user_id_1 && selectedMatch.status === "accepted_1") ||
                              (currentUserId === selectedMatch.user_id_2 && selectedMatch.status === "accepted_2");
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
              
              {/* Main Details Card (White Pane) */}
              <div className="form-card-premium" style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "2.2rem 2.2rem", border: "1px solid #e5e7eb", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column", gap: "24px", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
                
                {/* Back to Matches Button Inside White Pane */}
                <div>
                  <button
                    type="button"
                    className="btn-back-link"
                    onClick={() => setViewState("list")}
                  >
                    <ArrowLeft size={16} /> Back to Matches
                  </button>
                </div>

                {/* Header Row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "20px", borderBottom: "1px solid #f3f4f6", flexWrap: "wrap", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div className="avatar-frame" style={{ width: "64px", height: "64px", fontSize: "1.5rem" }}>
                      {selectedMatch.partner.photo ? (
                        <img src={selectedMatch.partner.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        selectedMatch.partner.first_name ? selectedMatch.partner.first_name[0].toUpperCase() : "?"
                      )}
                    </div>

                    <div>
                      <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "#35453f", margin: "0 0 4px" }}>
                        {selectedMatch.partner.first_name} {selectedMatch.partner.last_name}
                      </h2>
                      <p style={{ color: "#ec5e3b", fontSize: "0.92rem", margin: 0, fontWeight: "600" }}>
                        {selectedMatch.partner.role || "Executive Member"} {selectedMatch.partner.company_name ? `• ${selectedMatch.partner.company_name}` : ""}
                      </p>
                    </div>
                  </div>

                  <span style={{ backgroundColor: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", fontSize: "0.85rem", fontWeight: "700", padding: "6px 16px", borderRadius: "20px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle size={15} /> {Math.round(selectedMatch.score)}% Synergy Match
                  </span>
                </div>

                {/* Partner Business Intention */}
                <div>
                  <h3 style={{ margin: "0 0 10px 0", fontSize: "0.85rem", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Partner Business Intention
                  </h3>
                  <div style={{ 
                    padding: "20px 22px", 
                    background: "#f8fafc", 
                    borderRadius: "18px", 
                    border: "1px solid #e2e8f0", 
                    fontSize: "0.95rem", 
                    color: "#1f2937", 
                    lineHeight: 1.6,
                    fontStyle: "italic"
                  }}>
                    "{selectedMatch.partner.intent}"
                  </div>
                </div>

                {/* Synergy Evaluation */}
                <div>
                  <h3 style={{ margin: "0 0 10px 0", fontSize: "0.85rem", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Synergy Evaluation
                  </h3>
                  <div style={{ 
                    padding: "20px 22px", 
                    background: "#fff7ed", 
                    borderRadius: "18px", 
                    border: "1px solid #ffedd5", 
                    fontSize: "0.92rem", 
                    color: "#c2410c", 
                    lineHeight: 1.6
                  }}>
                    {selectedMatch.match_reason}
                  </div>
                </div>

                {/* Connection Status Toast */}
                {connectMessage && (
                  <div style={{
                    padding: "14px 20px",
                    borderRadius: "14px",
                    fontSize: "0.92rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: connectMessage.type === "success" ? "#f0fdf4" : "#fff7ed",
                    border: connectMessage.type === "success" ? "1px solid #86efac" : "1px solid #ffedd5",
                    color: connectMessage.type === "success" ? "#166534" : "#c2410c"
                  }}>
                    {connectMessage.text}
                  </div>
                )}

                {/* Compact Far-Right Action Buttons */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", paddingTop: "12px" }}>
                  {hasAccepted ? (
                    <div style={{
                      background: "#fff7ed",
                      border: "1px solid #ffedd5",
                      color: "#c2410c",
                      padding: "12px 24px",
                      borderRadius: "30px",
                      fontSize: "0.88rem",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#ec5e3b" }}></span>
                      Authorization sent — Awaiting partner confirmation...
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-action-secondary"
                        disabled={connectingMatchId === selectedMatch.id}
                        onClick={() => {
                          if (window.confirm("Decline this match?")) {
                            updateMatchStatus(selectedMatch.id, "reject")
                              .then(() => {
                                getMatches().then((latestMatches) => {
                                  setMatches(latestMatches);
                                  setViewState("list");
                                  window.dispatchEvent(new CustomEvent("refreshHeaderCounts"));
                                });
                              })
                              .catch(err => console.error(err));
                          }
                        }}
                      >
                        Decline match
                      </button>

                      <button 
                        type="button" 
                        className="btn-action-primary" 
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
                                  setTimeout(() => {
                                    setViewState("list");
                                    setConnectingMatchId(null);
                                    setConnectMessage(null);
                                  }, 2500);
                                } else {
                                  setConnectMessage({ type: "success", text: "Authorization sent! Awaiting partner response." });
                                  setConnectingMatchId(null);
                                }
                              });
                            })
                            .catch(err => {
                              console.error("Connect error:", err);
                              setConnectingMatchId(null);
                            });
                        }}
                      >
                        {connectingMatchId === selectedMatch.id ? "Connecting..." : "Connect & Introduce"}
                      </button>
                    </>
                  )}
                </div>

              </div>

            </div>
          );
        })()}

      </div>

      <Footer />
    </div>
  );
}
