import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getInboxMessages, getSentMessages, sendMessage, markMessageRead, isAuthenticated, getUserProfile, getOtherUserProfile } from "./api";
import { Mail, Send, MessageSquare, ArrowLeft, Smile, CheckCircle, User, Phone, Building } from "lucide-react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import threeProfessionalsImg from "./img/three_professionals.png";

export default function Messages() {
  const navigate = useNavigate();
  const location = useLocation();

  const [threads, setThreads] = useState([]);
  const [viewState, setViewState] = useState("list"); // "list" or "chat"
  const [activeThreadId, setActiveThreadId] = useState(null);

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState("");
  const [error, setError] = useState("");

  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);

  const activeThread = threads.find(t => t.partnerId === activeThreadId);

  // Group all messages (inbox + sent) by conversation partner
  const buildThreads = (inbox, sent) => {
    const threadMap = {};

    const getOrCreateThread = (partnerId, partnerName, partnerCompany) => {
      if (!threadMap[partnerId]) {
        threadMap[partnerId] = {
          partnerId,
          partnerName,
          partnerCompany,
          partnerPhoto: null,
          partnerPhone: null,
          partnerRole: null,
          messages: [],
          latestTime: null,
          unreadCount: 0
        };
      }
      return threadMap[partnerId];
    };

    inbox.forEach((msg) => {
      const partnerId = msg.sender_id;
      const name = `${msg.sender_first_name} ${msg.sender_last_name}`;
      const company = msg.sender_company;
      const photo = msg.sender_photo;
      const phone = msg.sender_phone;
      const role = msg.sender_role;
      const thread = getOrCreateThread(partnerId, name, company);
      
      if (photo && !thread.partnerPhoto) thread.partnerPhoto = photo;
      if (phone && !thread.partnerPhone) thread.partnerPhone = phone;
      if (role && !thread.partnerRole) thread.partnerRole = role;
      
      thread.messages.push({
        id: msg.id,
        direction: "incoming",
        subject: msg.subject,
        body: msg.body,
        sentAt: new Date(msg.sent_at),
        isRead: msg.is_read
      });

      if (!msg.is_read) {
        thread.unreadCount += 1;
      }
    });

    sent.forEach((msg) => {
      const partnerId = msg.recipient_id;
      const name = `${msg.recipient_first_name} ${msg.recipient_last_name}`;
      const company = msg.recipient_company;
      const photo = msg.recipient_photo;
      const phone = msg.recipient_phone;
      const role = msg.recipient_role;
      const thread = getOrCreateThread(partnerId, name, company);

      if (photo && !thread.partnerPhoto) thread.partnerPhoto = photo;
      if (phone && !thread.partnerPhone) thread.partnerPhone = phone;
      if (role && !thread.partnerRole) thread.partnerRole = role;

      thread.messages.push({
        id: msg.id,
        direction: "outgoing",
        subject: msg.subject,
        body: msg.body,
        sentAt: new Date(msg.sent_at),
        isRead: true
      });
    });

    const threadsList = Object.values(threadMap).map((thread) => {
      thread.messages.sort((a, b) => a.sentAt - b.sentAt);
      if (thread.messages.length > 0) {
        thread.latestTime = thread.messages[thread.messages.length - 1].sentAt;
      }
      return thread;
    });

    threadsList.sort((a, b) => (b.latestTime || 0) - (a.latestTime || 0));
    return threadsList;
  };

  const loadMessages = (selectPartnerId = null) => {
    setLoadingMessages(true);
    Promise.all([getInboxMessages(), getSentMessages()])
      .then(([inbox, sent]) => {
        const inboxList = Array.isArray(inbox) ? inbox : [];
        const sentList = Array.isArray(sent) ? sent : [];
        
        const conversationThreads = buildThreads(inboxList, sentList);
        setThreads(conversationThreads);

        if (selectPartnerId) {
          setActiveThreadId(Number(selectPartnerId));
          setViewState("chat");
        }
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
      })
      .finally(() => {
        setLoadingMessages(false);
      });
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/signin");
      return;
    }

    getUserProfile()
      .then((profile) => {
        if (profile && profile.id) {
          setCurrentUserId(profile.id);
        }
      })
      .catch(() => {});

    const params = new URLSearchParams(window.location.search);
    const partnerIdParam = params.get("partner_id");
    loadMessages(partnerIdParam);
  }, [navigate]);

  useEffect(() => {
    if (viewState === "chat" && activeThread) {
      // Auto-scroll chat to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

      // Mark unread incoming messages as read
      activeThread.messages.forEach(msg => {
        if (msg.direction === "incoming" && !msg.isRead) {
          markMessageRead(msg.id).catch(err => console.error(err));
        }
      });
    }
  }, [viewState, activeThreadId, activeThread?.messages?.length]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;

    setSendingMessage(true);
    setError("");

    sendMessage({
      recipient_id: activeThread.partnerId,
      subject: `Message to ${activeThread.partnerName}`,
      body: replyText.trim()
    })
      .then(() => {
        setReplyText("");
        setMessageSuccess("Message sent!");
        setTimeout(() => setMessageSuccess(""), 3000);
        loadMessages(activeThread.partnerId);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Failed to send message.");
      })
      .finally(() => {
        setSendingMessage(false);
      });
  };

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

        .thread-card-item {
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
        .thread-card-item:hover {
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

        .msg-bubble-incoming {
          background: #f3f4f6;
          color: #1f2937;
          border-radius: 18px 18px 18px 4px;
          padding: 14px 18px;
          max-width: 75%;
          align-self: flex-start;
          font-size: 0.92rem;
          line-height: 1.5;
        }
        .msg-bubble-outgoing {
          background: #35453f;
          color: #ffffff;
          border-radius: 18px 18px 4px 18px;
          padding: 14px 18px;
          max-width: 75%;
          align-self: flex-end;
          font-size: 0.92rem;
          line-height: 1.5;
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
              <img src={threeProfessionalsImg} alt="Messages" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>

            {/* Header Content */}
            <div style={{ flex: 1, minWidth: "240px" }}>
              <div style={{ color: "#ec5e3b", fontWeight: "800", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle size={14} /> Direct Communications
              </div>

              <h1 style={{ fontSize: "2.1rem", fontWeight: "800", color: "#35453f", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
                Messages
              </h1>

              <p style={{ color: "#4b5563", fontSize: "0.95rem", margin: 0, fontWeight: "500", lineHeight: "1.5", maxWidth: "820px" }}>
                Communicate directly with your verified connections in real time.
              </p>
            </div>

          </div>
        </div>

        {/* ════ VIEW 1: MESSAGES LIST VIEW (INITIAL LOAD) ════ */}
        {viewState === "list" && (
          <div className="form-card-premium" style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "2rem 2.2rem", border: "1px solid #e5e7eb", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#35453f", margin: 0 }}>
                Conversations
              </h2>
              <span style={{ backgroundColor: "#ec5e3b", color: "#ffffff", padding: "4px 14px", borderRadius: "16px", fontSize: "0.8rem", fontWeight: "700" }}>
                {threads.length} {threads.length === 1 ? "Conversation" : "Conversations"}
              </span>
            </div>

            {loadingMessages ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}>
                Loading messages...
              </div>
            ) : threads.length === 0 ? (
              <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed #d1d5db", borderRadius: "20px", background: "#f8fafc" }}>
                <Smile size={42} color="#ec5e3b" style={{ margin: "0 auto 12px", opacity: 0.8 }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#35453f", margin: "0 0 6px" }}>No Messages Yet</h3>
                <p style={{ color: "#6b7280", fontSize: "0.9rem", maxWidth: "460px", margin: "0 auto", lineHeight: "1.5" }}>
                  Connect with partners on your Matches page to establish direct communication threads.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {threads.map((t) => {
                  const initial = t.partnerName ? t.partnerName[0].toUpperCase() : "?";
                  const lastMsg = t.messages.length > 0 ? t.messages[t.messages.length - 1] : null;

                  return (
                    <div
                      key={t.partnerId}
                      className="thread-card-item"
                      onClick={() => {
                        setActiveThreadId(t.partnerId);
                        setViewState("chat");
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
                        <div className="avatar-frame">
                          {t.partnerPhoto ? (
                            <img src={t.partnerPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            initial
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "#1f2937", margin: 0 }}>
                              {t.partnerName}
                            </h3>
                            {t.unreadCount > 0 && (
                              <span style={{ backgroundColor: "#ec5e3b", color: "#ffffff", fontSize: "0.72rem", fontWeight: "700", padding: "2px 8px", borderRadius: "10px" }}>
                                {t.unreadCount} Unread
                              </span>
                            )}
                          </div>

                          <p style={{ color: "#ec5e3b", fontSize: "0.85rem", fontWeight: "600", margin: "2px 0 4px" }}>
                            {t.partnerRole || "Executive Member"} {t.partnerCompany ? `• ${t.partnerCompany}` : ""}
                          </p>

                          {lastMsg && (
                            <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {lastMsg.direction === "outgoing" ? "You: " : ""}{lastMsg.body}
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ec5e3b", fontWeight: "700", fontSize: "0.85rem" }}>
                        Open Conversation →
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ════ VIEW 2: SINGLE CONVERSATION VIEW (ON CLICK) ════ */}
        {viewState === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
            
            {/* Main Chat Card (White Pane) */}
            <div className="form-card-premium" style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "2.2rem 2.2rem", border: "1px solid #e5e7eb", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column", gap: "20px", width: "100%", maxWidth: "100%", boxSizing: "border-box", minHeight: "560px" }}>
              
              {/* Back to Messages Button Inside White Pane */}
              <div>
                <button
                  type="button"
                  className="btn-back-link"
                  onClick={() => setViewState("list")}
                >
                  <ArrowLeft size={16} /> Back to Messages
                </button>
              </div>

              {activeThread ? (
                <>
                  {/* Chat Partner Header Row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "18px", borderBottom: "1px solid #f3f4f6", flexWrap: "wrap", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div className="avatar-frame" style={{ width: "56px", height: "56px", fontSize: "1.3rem" }}>
                        {activeThread.partnerPhoto ? (
                          <img src={activeThread.partnerPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          activeThread.partnerName ? activeThread.partnerName[0].toUpperCase() : "?"
                        )}
                      </div>

                      <div>
                        <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#35453f", margin: "0 0 2px" }}>
                          {activeThread.partnerName}
                        </h2>
                        <p style={{ color: "#ec5e3b", fontSize: "0.88rem", margin: 0, fontWeight: "600" }}>
                          {activeThread.partnerRole || "Executive Member"} {activeThread.partnerCompany ? `• ${activeThread.partnerCompany}` : ""}
                        </p>
                      </div>
                    </div>

                    {activeThread.partnerPhone && (
                      <span style={{ backgroundColor: "#f8fafc", color: "#4b5563", border: "1px solid #e2e8f0", fontSize: "0.82rem", fontWeight: "600", padding: "6px 14px", borderRadius: "18px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Phone size={14} color="#ec5e3b" /> {activeThread.partnerPhone}
                      </span>
                    )}
                  </div>

                  {/* Messages Thread Bubbles */}
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px", padding: "12px 4px", minHeight: "260px", maxHeight: "400px" }}>
                    {activeThread.messages.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px", color: "#6b7280", fontSize: "0.9rem" }}>
                        No messages exchanged yet. Send a message below to start the conversation.
                      </div>
                    ) : (
                      activeThread.messages.map((msg, idx) => (
                        <div key={idx} className={msg.direction === "outgoing" ? "msg-bubble-outgoing" : "msg-bubble-incoming"}>
                          <div>{msg.body}</div>
                          <div style={{ fontSize: "0.72rem", opacity: 0.75, marginTop: "4px", textAlign: msg.direction === "outgoing" ? "right" : "left" }}>
                            {msg.sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Feedback toasts */}
                  {messageSuccess && (
                    <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", color: "#166534", padding: "10px 16px", borderRadius: "12px", fontSize: "0.88rem", fontWeight: "600" }}>
                      ✓ {messageSuccess}
                    </div>
                  )}
                  {error && (
                    <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "10px 16px", borderRadius: "12px", fontSize: "0.88rem", fontWeight: "600" }}>
                      ⚠️ {error}
                    </div>
                  )}

                  {/* Reply Input Form */}
                  <form onSubmit={handleSendMessage} style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "12px", borderTop: "1px solid #f3f4f6" }}>
                    <textarea
                      rows={3}
                      className="input-premium"
                      placeholder="Type your message..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      style={{ resize: "vertical" }}
                      required
                    />

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="submit"
                        disabled={sendingMessage}
                        className="btn-action-primary"
                      >
                        {sendingMessage ? "Sending..." : "Send Message"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}>
                  Select a conversation from the list to view messages.
                </div>
              )}

            </div>

          </div>
        )}

      </div>

      <Footer />
    </div>
  );
}
