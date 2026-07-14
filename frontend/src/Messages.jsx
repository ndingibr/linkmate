import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getInboxMessages, getSentMessages, sendMessage, markMessageRead, logout, isAuthenticated, getUserProfile, getOtherUserProfile } from "./api";
import { Mail, Send, Inbox, MessageSquare, Paperclip, Image, Smile } from "lucide-react";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Messages() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState("");
  const [error, setError] = useState("");
  const [currentUserPhoto, setCurrentUserPhoto] = useState(null);
  const [currentUserInitial, setCurrentUserInitial] = useState("Y");
  const [currentUserPhone, setCurrentUserPhone] = useState("");

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
          messages: [],
          latestTime: null,
          unreadCount: 0
        };
      }
      return threadMap[partnerId];
    };

    // Add inbox messages (incoming)
    inbox.forEach((msg) => {
      const partnerId = msg.sender_id;
      const name = `${msg.sender_first_name} ${msg.sender_last_name}`;
      const company = msg.sender_company;
      const photo = msg.sender_photo;
      const phone = msg.sender_phone;
      const thread = getOrCreateThread(partnerId, name, company);
      
      if (photo && !thread.partnerPhoto) {
        thread.partnerPhoto = photo;
      }
      if (phone && !thread.partnerPhone) {
        thread.partnerPhone = phone;
      }
      
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

    // Add sent messages (outgoing)
    sent.forEach((msg) => {
      const partnerId = msg.recipient_id;
      const name = `${msg.recipient_first_name} ${msg.recipient_last_name}`;
      const company = msg.recipient_company;
      const photo = msg.recipient_photo;
      const phone = msg.recipient_phone;
      const thread = getOrCreateThread(partnerId, name, company);

      if (photo && !thread.partnerPhoto) {
        thread.partnerPhoto = photo;
      }
      if (phone && !thread.partnerPhone) {
        thread.partnerPhone = phone;
      }

      thread.messages.push({
        id: msg.id,
        direction: "outgoing",
        subject: msg.subject,
        body: msg.body,
        sentAt: new Date(msg.sent_at),
        isRead: true
      });
    });

    // Process and sort each thread
    const threadsList = Object.values(threadMap).map((thread) => {
      thread.messages.sort((a, b) => a.sentAt - b.sentAt);
      if (thread.messages.length > 0) {
        thread.latestTime = thread.messages[thread.messages.length - 1].sentAt;
      }
      return thread;
    });

    // Sort threads by latest message time descending
    threadsList.sort((a, b) => b.latestTime - a.latestTime);
    return threadsList;
  };

  const loadMessages = (selectPartnerId = null) => {
    // Attempt to load from sessionStorage cache first
    const cachedInbox = sessionStorage.getItem("linkmate_inbox");
    const cachedSent = sessionStorage.getItem("linkmate_sent");
    let loadedFromCache = false;

    if (cachedInbox && cachedSent) {
      try {
        const inboxList = JSON.parse(cachedInbox);
        const sentList = JSON.parse(cachedSent);
        const conversationThreads = buildThreads(inboxList, sentList);
        
        setThreads(conversationThreads);
        
        if (selectPartnerId) {
          setActiveThreadId(Number(selectPartnerId));
        } else if (!activeThreadId && conversationThreads.length > 0) {
          setActiveThreadId(conversationThreads[0].partnerId);
        }
        loadedFromCache = true;
      } catch (e) {
        console.error("Failed to parse message cache:", e);
      }
    }

    if (!loadedFromCache) {
      setLoadingMessages(true);
    }

    Promise.all([getInboxMessages(), getSentMessages()])
      .then(([inbox, sent]) => {
        const inboxList = Array.isArray(inbox) ? inbox : [];
        const sentList = Array.isArray(sent) ? sent : [];
        
        // Cache the latest messages
        sessionStorage.setItem("linkmate_inbox", JSON.stringify(inboxList));
        sessionStorage.setItem("linkmate_sent", JSON.stringify(sentList));
        
        const conversationThreads = buildThreads(inboxList, sentList);
        
        // Check if the selected partner ID already has a thread
        const hasThread = selectPartnerId ? conversationThreads.some(t => t.partnerId === Number(selectPartnerId)) : false;

        if (selectPartnerId && !hasThread) {
          // Fetch the partner details to construct a placeholder thread
          getOtherUserProfile(selectPartnerId)
            .then((partnerProfile) => {
              if (partnerProfile) {
                const newThread = {
                  partnerId: partnerProfile.id,
                  partnerName: `${partnerProfile.first_name} ${partnerProfile.last_name}`,
                  partnerCompany: partnerProfile.company_name,
                  partnerPhoto: partnerProfile.photo,
                  partnerPhone: partnerProfile.phone,
                  messages: [],
                  latestTime: new Date(),
                  unreadCount: 0
                };
                setThreads([newThread, ...conversationThreads]);
                setActiveThreadId(partnerProfile.id);
              } else {
                setThreads(conversationThreads);
                if (conversationThreads.length > 0) {
                  setActiveThreadId(conversationThreads[0].partnerId);
                }
              }
            })
            .catch((err) => {
              console.error("Failed to load other user profile for placeholder thread:", err);
              setThreads(conversationThreads);
              if (conversationThreads.length > 0) {
                setActiveThreadId(conversationThreads[0].partnerId);
              }
            });
        } else {
          setThreads(conversationThreads);
          if (conversationThreads.length > 0) {
            if (selectPartnerId) {
              setActiveThreadId(Number(selectPartnerId));
            } else if (!activeThreadId) {
              setActiveThreadId(conversationThreads[0].partnerId);
            }
          }
        }
      })
      .catch((err) => console.error("Failed to load messages:", err))
      .finally(() => setLoadingMessages(false));
  };

  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    // Fetch logged-in user profile to get their photo, initials, and phone
    getUserProfile()
      .then((profile) => {
        if (profile) {
          if (profile.photo) {
            setCurrentUserPhoto(profile.photo);
          }
          if (profile.first_name) {
            setCurrentUserInitial(profile.first_name[0].toUpperCase());
          }
          if (profile.phone) {
            setCurrentUserPhone(profile.phone);
          }
        }
      })
      .catch((err) => console.error("Error loading user profile details:", err));

    const partnerIdFromState = location.state?.partnerId;
    loadMessages(partnerIdFromState);
  }, [navigate, location.state]);

  // Mark all unread incoming messages in current active thread as read
  useEffect(() => {
    if (!activeThread) return;
    const unreadMsgs = activeThread.messages.filter(m => m.direction === "incoming" && !m.isRead);
    if (unreadMsgs.length === 0) return;

    Promise.all(unreadMsgs.map(m => markMessageRead(m.id)))
      .then(() => {
        sessionStorage.removeItem("linkmate_inbox");
        sessionStorage.removeItem("linkmate_sent");
        // Update local state to clear unread badges
        setThreads(threads.map(t => {
          if (t.partnerId === activeThreadId) {
            return {
              ...t,
              unreadCount: 0,
              messages: t.messages.map(m => m.direction === "incoming" ? { ...m, isRead: true } : m)
            };
          }
          return t;
        }));
      })
      .catch(err => console.error("Error marking thread read:", err));
  }, [activeThreadId, threads.length]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if ((!replyText.trim() && !attachedFile) || !activeThread) return;

    setSendingMessage(true);
    setError("");
    setMessageSuccess("");

    try {
      const lastMsg = activeThread.messages[activeThread.messages.length - 1];
      const subject = lastMsg ? (lastMsg.subject.startsWith("Re:") ? lastMsg.subject : `Re: ${lastMsg.subject}`) : "B2B Connection Inquiry";

      let finalBody = replyText;
      if (attachedFile) {
        finalBody += `\n\n[Attachment: ${attachedFile.name}]`;
      }

      await sendMessage({
        recipient_id: activeThread.partnerId,
        subject: subject,
        body: finalBody
      });

      sessionStorage.removeItem("linkmate_inbox");
      sessionStorage.removeItem("linkmate_sent");

      setReplyText("");
      setAttachedFile(null);
      setMessageSuccess("Reply sent!");
      loadMessages(activeThread.partnerId); // reload and keep focus on this thread
      setTimeout(() => setMessageSuccess(""), 3000);
    } catch (err) {
      setError("Failed to send reply. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

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
          font-size: 2rem;
          font-weight: 800;
          color: #f17c13;
          margin: 20px 0 4px;
          letter-spacing: -0.03em;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 12px;
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
        .chat-header {
          padding: 18px 24px;
          border-bottom: 1px solid #f3f4f6;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left;
        }
        .chat-partner-name {
          font-size: 1.1rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 2px 0;
        }
        .chat-partner-company {
          font-size: 0.8rem;
          color: #f17c13;
          font-weight: 700;
        }
        .chat-timeline {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: #ffffff;
        }
        
        /* Chat bubble styles */
        .chat-bubble-row {
          display: flex;
          flex-direction: column;
        }
        .chat-bubble-row.incoming {
          align-items: flex-start;
        }
        .chat-bubble-row.outgoing {
          align-items: flex-end;
        }
        .chat-bubble {
          padding: 12px 18px;
          border-radius: 14px;
          font-size: 0.92rem;
          line-height: 1.5;
          text-align: left;
          white-space: pre-line;
          word-break: break-word;
        }
        .chat-bubble-row.incoming .chat-bubble {
          background: #f3f4f6;
          color: #374151;
          border: none;
          border-top-left-radius: 0;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }
        .chat-bubble-row.outgoing .chat-bubble {
          background: #f17c13;
          color: #ffffff;
          border-top-right-radius: 0;
          box-shadow: 0 2px 8px rgba(241, 124, 19, 0.15);
        }
        .chat-bubble-meta {
          font-size: 0.72rem;
          color: #9ca3af;
        }

        .chat-input-area {
          padding: 18px 24px;
          border-top: 1px solid #f3f4f6;
          background: #ffffff;
        }
        .chat-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .chat-textarea {
          width: 100%;
          height: 72px;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          font-size: 0.9rem;
          outline: none;
          resize: none;
          font-family: inherit;
          box-sizing: border-box;
          line-height: 1.5;
          transition: all 0.15s;
        }
        .chat-textarea:focus {
          border-color: #f17c13;
          box-shadow: 0 0 0 3px rgba(241,124,19,0.15);
        }
        .chat-action-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        /* ─── RIGHT PANEL: CONTACTS LIST ─── */
        .contacts-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          background: #ffffff;
        }
        .contacts-header {
          padding: 18px;
          border-bottom: 1px solid #f3f4f6;
          font-weight: 800;
          font-size: 1rem;
          color: #111827;
          background: #ffffff;
          text-align: left;
        }
        .contacts-items {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .contact-item {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          background: #ffffff;
          cursor: pointer;
          transition: background 0.15s;
          position: relative;
          text-align: left;
        }
        .contact-item:hover {
          background: #f9fafb;
        }
        .contact-item.selected {
          background: #ffffff;
          border-left: 4px solid #f17c13;
        }
        .contact-avatar-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }
        .contact-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #f17c13;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.95rem;
          overflow: hidden;
          flex-shrink: 0;
          border: 1px solid #e5e7eb;
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
          margin-left: 50px;
        }
        .contact-badge {
          background: #10b981;
          color: white;
          font-size: 0.65rem;
          font-weight: 850;
          padding: 2px 7px;
          border-radius: 10px;
          position: absolute;
          top: 18px;
          right: 20px;
        }

        .ps-btn-primary {
          background: #f17c13;
          color: #fff;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background 0.15s;
        }
        .ps-btn-primary:hover {
          background: #d96a0a;
        }
        .ps-btn-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        
        .ps-alert-ok {
          color: #065f46;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .ps-alert-err {
          color: #b91c1c;
          font-size: 0.8rem;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .msg-layout {
            grid-template-columns: 1fr;
            height: auto;
            min-height: unset;
          }
          .contacts-panel {
            border-top: 1px solid #eddcd2;
            height: 300px;
          }
        }
      `}</style>

      <div className="msg-container">
        <h1 className="msg-page-title">
          <MessageSquare size={32} style={{ color: "#f17c13" }} />
          Messages
        </h1>
        <p className="msg-page-sub">
          Manage your messages, conversations, and preferences.
        </p>

        <div className="msg-layout">
          {/* LEFT PANEL: ACTIVE CHAT WINDOW */}
          <div className="chat-panel">
            {activeThread ? (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Chat Partner Details Header */}
                <div className="chat-header">
                  <div>
                    <h2 
                      className="chat-partner-name" 
                      style={{ cursor: "pointer", transition: "color 0.15s" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#f17c13"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "#111827"}
                      onClick={() => navigate(`/profile/${activeThread.partnerId}`)}
                    >
                      {activeThread.partnerName}
                    </h2>
                    {activeThread.partnerCompany && (
                      <div className="chat-partner-company">{activeThread.partnerCompany}</div>
                    )}
                  </div>
                </div>

                {/* Timeline of Messages bubbles */}
                <div className="chat-timeline">
                  {activeThread.messages.map((m) => {
                    const isIncoming = m.direction === "incoming";
                    const avatarPhoto = isIncoming ? activeThread.partnerPhoto : currentUserPhoto;
                    const initial = isIncoming 
                      ? (activeThread.partnerName ? activeThread.partnerName[0].toUpperCase() : "?")
                      : currentUserInitial;

                    return (
                      <div 
                        key={m.id} 
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          alignSelf: isIncoming ? "flex-start" : "flex-end",
                          maxWidth: "75%"
                        }}
                      >
                        {/* Avatar on the left for incoming messages */}
                        {isIncoming && (
                          <div 
                            onClick={() => navigate(`/profile/${activeThread.partnerId}`)}
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              backgroundColor: "#f17c13",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "800",
                              fontSize: "0.85rem",
                              overflow: "hidden",
                              flexShrink: 0,
                              border: "1px solid #eddcd2",
                              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                              cursor: "pointer"
                            }}
                          >
                            {avatarPhoto ? (
                              <img src={avatarPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              initial
                            )}
                          </div>
                        )}

                        {/* Message Bubble Container */}
                        <div className={`chat-bubble-row ${isIncoming ? "incoming" : "outgoing"}`}>
                          {/* Name and Phone metadata ABOVE the bubble */}
                          <div className="chat-bubble-meta" style={{ marginBottom: "4px", alignSelf: isIncoming ? "flex-start" : "flex-end" }}>
                            {isIncoming ? (
                              <span 
                                onClick={() => navigate(`/profile/${activeThread.partnerId}`)}
                                style={{ cursor: "pointer", fontWeight: "600", transition: "color 0.15s" }}
                                onMouseEnter={(e) => e.currentTarget.style.color = "#f17c13"}
                                onMouseLeave={(e) => e.currentTarget.style.color = "#9ca3af"}
                              >
                                {activeThread.partnerName} ({activeThread.partnerPhone || "No Phone"})
                              </span>
                            ) : (
                              `You (${currentUserPhone || "No Phone"})`
                            )}
                            {" • "}{m.sentAt.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          
                          <div className="chat-bubble">
                            {m.body.includes("[Attachment:") ? (
                              <div>
                                <div style={{ whiteSpace: "pre-line" }}>
                                  {m.body.split("[Attachment:")[0]}
                                </div>
                                <div 
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    backgroundColor: isIncoming ? "#ffffff" : "rgba(255, 255, 255, 0.18)",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    marginTop: "8px",
                                    border: isIncoming ? "1px solid #e5e7eb" : "none"
                                  }}
                                >
                                  <Paperclip size={14} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "0.8rem", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {m.body.split("[Attachment:")[1].replace("]", "")}
                                    </div>
                                    <div style={{ fontSize: "0.68rem", opacity: 0.85 }}>Attached Document</div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              m.body
                            )}
                          </div>
                        </div>

                        {/* Avatar on the right for outgoing messages */}
                        {!isIncoming && (
                          <div 
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              backgroundColor: "#374151",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "800",
                              fontSize: "0.85rem",
                              overflow: "hidden",
                              flexShrink: 0,
                              border: "1px solid #e5e7eb",
                              boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                            }}
                          >
                            {avatarPhoto ? (
                              <img src={avatarPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              initial
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Reply Compose Area */}
                <div className="chat-input-area">
                  <form onSubmit={handleReplySubmit} className="chat-form">
                    <textarea
                      required
                      placeholder={`Send a message to ${activeThread.partnerName}...`}
                      className="chat-textarea"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleReplySubmit(e);
                        }
                      }}
                    />
                    {attachedFile && (
                      <div 
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          backgroundColor: "#f3f4f6",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          color: "#374151",
                          marginBottom: "10px"
                        }}
                      >
                        <Paperclip size={12} />
                        <span>{attachedFile.name} ({attachedFile.size})</span>
                        <button 
                          type="button" 
                          style={{ border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", fontWeight: "800", marginLeft: "4px" }}
                          onClick={() => setAttachedFile(null)}
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <div className="chat-action-bar">
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", color: "#4b5563" }}>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          style={{ display: "none" }} 
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setAttachedFile({ name: file.name, size: (file.size / 1024).toFixed(1) + " KB" });
                            }
                          }}
                        />
                        
                        <button 
                          type="button" 
                          title="Attach an image"
                          style={{ border: "none", background: "none", cursor: "pointer", color: "#4b5563", padding: 0 }}
                          onClick={() => fileInputRef.current.click()}
                        >
                          <Image size={18} />
                        </button>
                        
                        <button 
                          type="button" 
                          title="Attach a document"
                          style={{ border: "none", background: "none", cursor: "pointer", color: "#4b5563", padding: 0 }}
                          onClick={() => fileInputRef.current.click()}
                        >
                          <Paperclip size={18} />
                        </button>
                        
                        <button 
                          type="button" 
                          title="Add a GIF"
                          style={{ border: "none", background: "none", cursor: "pointer", color: "#4b5563", padding: 0, fontWeight: "750", fontSize: "0.75rem" }}
                          onClick={() => alert("GIF attachments are simulated in this prototype.")}
                        >
                          GIF
                        </button>
                        
                        <button 
                          type="button" 
                          title="Add an emoji"
                          style={{ border: "none", background: "none", cursor: "pointer", color: "#4b5563", padding: 0 }}
                          onClick={() => setReplyText(prev => prev + " 😊")}
                        >
                          <Smile size={18} />
                        </button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div>
                          {messageSuccess && <span className="ps-alert-ok">✅ {messageSuccess}</span>}
                          {error && <span className="ps-alert-err">⚠️ {error}</span>}
                        </div>
                        <button
                          type="submit"
                          disabled={sendingMessage || (!replyText.trim() && !attachedFile)}
                          className="ps-btn-primary"
                        >
                          <Send size={12} />
                          <span>{sendingMessage ? "Sending..." : "Send"}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="msg-detail-empty">
                <Inbox size={48} style={{ color: "#f17c13", opacity: 0.8 }} />
                <span>Select a contact to view B2B message history</span>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: CONTACTS/PEOPLE LIST */}
          <div className="contacts-panel">
            <div className="contacts-header">
              Conversations
            </div>

            <div className="contacts-items">
              {loadingMessages && threads.length === 0 ? (
                <div style={{ padding: "40px", color: "#6b7280", textAlign: "center", fontSize: "0.85rem" }}>
                  Loading contacts...
                </div>
              ) : threads.length === 0 ? (
                <div style={{ padding: "60px 20px", color: "#9ca3af", textAlign: "center", fontSize: "0.85rem" }}>
                  No active conversations found.
                </div>
              ) : (
                threads.map((thread) => {
                  const isSelected = activeThreadId === thread.partnerId;
                  const latestMsg = thread.messages[thread.messages.length - 1];
                  const initial = thread.partnerName ? thread.partnerName[0].toUpperCase() : "?";

                  return (
                    <div
                      key={thread.partnerId}
                      className={`contact-item ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        setActiveThreadId(thread.partnerId);
                        setReplyText("");
                        setError("");
                      }}
                    >
                      {thread.unreadCount > 0 && (
                        <span className="contact-badge">{thread.unreadCount}</span>
                      )}
                      
                      <div className="contact-avatar-row">
                        <div className="contact-avatar">
                          {thread.partnerPhoto ? (
                            <img src={thread.partnerPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            initial
                          )}
                        </div>
                        <div>
                          <div className="contact-name">
                            {thread.partnerName}
                          </div>
                          {thread.partnerCompany && (
                            <div className="contact-company">{thread.partnerCompany}</div>
                          )}
                        </div>
                      </div>

                      {latestMsg && (
                        <div className="contact-snippet">
                          {latestMsg.direction === "outgoing" ? "You: " : ""}{latestMsg.body}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
