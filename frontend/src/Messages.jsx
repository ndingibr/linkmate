import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getInboxMessages, getSentMessages, sendMessage, markMessageRead, logout, isAuthenticated, getUserProfile, getOtherUserProfile, getMatches, updateMatchStatus } from "./api";
import { Mail, Send, Inbox, MessageSquare, Paperclip, Image, Smile, X } from "lucide-react";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Messages() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showCelebrateModal, setShowCelebrateModal] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState(() => {
    return sessionStorage.getItem("activeSidebarTab") || "messages";
  });
  
  useEffect(() => {
    sessionStorage.setItem("activeSidebarTab", activeSidebarTab);
  }, [activeSidebarTab]);

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState("");
  const [error, setError] = useState("");
  const [currentUserPhoto, setCurrentUserPhoto] = useState(null);
  const [currentUserInitial, setCurrentUserInitial] = useState("Y");
  const [currentUserPhone, setCurrentUserPhone] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

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

    // Add inbox messages (incoming)
    inbox.forEach((msg) => {
      const partnerId = msg.sender_id;
      const name = `${msg.sender_first_name} ${msg.sender_last_name}`;
      const company = msg.sender_company;
      const photo = msg.sender_photo;
      const phone = msg.sender_phone;
      const role = msg.sender_role;
      const thread = getOrCreateThread(partnerId, name, company);
      
      if (photo && !thread.partnerPhoto) {
        thread.partnerPhoto = photo;
      }
      if (phone && !thread.partnerPhone) {
        thread.partnerPhone = phone;
      }
      if (role && !thread.partnerRole) {
        thread.partnerRole = role;
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
      const role = msg.recipient_role;
      const thread = getOrCreateThread(partnerId, name, company);

      if (photo && !thread.partnerPhoto) {
        thread.partnerPhoto = photo;
      }
      if (phone && !thread.partnerPhone) {
        thread.partnerPhone = phone;
      }
      if (role && !thread.partnerRole) {
        thread.partnerRole = role;
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

    getMatches()
      .then(setMatches)
      .catch(err => console.error("Error loading matches:", err));

    // Fetch logged-in user profile to get their photo, initials, and phone
    getUserProfile()
      .then((profile) => {
        if (profile) {
          if (profile.id) {
            setCurrentUserId(profile.id);
          }
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

        /* Matches Ring & Carousel styles */
        .matches-ring-section {
          padding: 14px 16px;
          border-bottom: 1px solid #f3f4f6;
          background: #fdfaf6;
          text-align: left;
        }
        .matches-ring-title {
          font-size: 0.72rem;
          font-weight: 850;
          color: #f17c13;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }
        .matches-ring-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 6px;
        }
        .matches-ring-scroll::-webkit-scrollbar {
          height: 4px;
        }
        .matches-ring-scroll::-webkit-scrollbar-thumb {
          background-color: #ffd8b3;
          border-radius: 4px;
        }
        .matches-ring-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        .matches-ring-avatar-wrapper {
          position: relative;
          width: 52px;
          height: 52px;
        }
        .matches-ring-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #f17c13 0%, #ffedd5 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1rem;
          overflow: hidden;
          border: 2px solid #f17c13;
          box-shadow: 0 3px 8px rgba(241, 124, 19, 0.15);
          transition: transform 0.2s ease;
        }
        .matches-ring-item:hover .matches-ring-avatar {
          transform: scale(1.06);
        }
        .matches-ring-percentage {
          position: absolute;
          bottom: -2px;
          right: -2px;
          background: #f17c13;
          color: #ffffff;
          font-size: 0.62rem;
          font-weight: 850;
          padding: 2px 4px;
          border-radius: 6px;
          border: 1px solid #ffffff;
          line-height: 1;
        }
        .matches-ring-name {
          font-size: 0.72rem;
          font-weight: 700;
          color: #4b5563;
          margin-top: 5px;
          max-width: 56px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .msg-detail-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 500px;
          padding: 40px;
          box-sizing: border-box;
          color: #4b5563;
          text-align: center;
          background: #ffffff;
        }
        .msg-detail-empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #fffbeb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f17c13;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(241, 124, 19, 0.1);
        }
        .msg-detail-empty-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px 0;
        }
        .msg-detail-empty-text {
          font-size: 0.875rem;
          color: #6b7280;
          max-width: 320px;
          line-height: 1.5;
          margin: 0 0 28px 0;
        }
        .msg-detail-empty-steps {
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-align: left;
          width: 100%;
          max-width: 360px;
          padding: 20px;
          border-radius: 14px;
          background: #fafafb;
          border: 1px solid #e5e7eb;
          box-sizing: border-box;
        }
        .msg-detail-empty-step {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .msg-detail-empty-step-num {
          background: #ffedd5;
          color: #f17c13;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 800;
          flex-shrink: 0;
        }
        .msg-detail-empty-step-content {
          font-size: 0.82rem;
          color: #374151;
          line-height: 1.4;
        }

        .contacts-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }
        .contacts-tab {
          flex: 1;
          background: none;
          border: none;
          padding: 14px 16px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 700;
          color: #9ca3af;
          border-bottom: 2px solid transparent;
          transition: all 0.15s;
          text-align: center;
        }
        .contacts-tab:hover {
          color: #374151;
          background: #fafafb;
        }
        .contacts-tab.active {
          color: #f17c13;
          border-bottom-color: #f17c13;
        }

        /* OkCupid celebrate modal overlay styles */
        .celebrate-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(17, 24, 39, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .celebrate-card {
          background: #ffffff;
          border-radius: 20px;
          width: 90%;
          max-width: 420px;
          padding: 28px 24px;
          box-sizing: border-box;
          text-align: center;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          position: relative;
          animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 1px solid #eddcd2;
        }
        @keyframes scaleUp {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .celebrate-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          transition: color 0.15s;
        }
        .celebrate-close-btn:hover {
          color: #374151;
        }
        .celebrate-circles-row {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 16px 0 20px;
          position: relative;
        }
        .celebrate-circle {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: #fdfbf7;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.8rem;
          color: #f17c13;
          flex-shrink: 0;
        }
        .celebrate-circle.left-avatar {
          background: linear-gradient(135deg, #f17c13 0%, #ffedd5 100%);
          color: white;
          z-index: 2;
        }
        .celebrate-circle.right-avatar {
          margin-left: -25px;
          z-index: 1;
          border: 3px solid #ffffff;
        }
        .celebrate-heart-badge {
          position: absolute;
          z-index: 3;
          background: #f17c13;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(241, 124, 19, 0.4);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .celebrate-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 6px 0;
        }
        .celebrate-reason {
          font-size: 0.85rem;
          color: #4b5563;
          line-height: 1.5;
          margin: 12px 0 20px 0;
          padding: 12px;
          background: #fafafb;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          text-align: left;
        }
        .celebrate-match-badge {
          display: inline-block;
          background: #fffbeb;
          color: #d97706;
          font-weight: 700;
          font-size: 0.75rem;
          padding: 4px 12px;
          border-radius: 12px;
          margin-bottom: 10px;
          border: 1px solid #fef3c7;
        }
        .celebrate-action-link {
          display: block;
          width: fit-content;
          margin: 16px auto 0 auto;
          background: #f17c13;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 10px 24px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s;
          text-decoration: none;
          box-shadow: 0 4px 10px rgba(241, 124, 19, 0.2);
        }
        .celebrate-action-link:hover {
          background: #d96a0a;
          color: #ffffff;
        }
        .celebrate-decline {
          display: block;
          width: fit-content;
          margin: 16px auto 0 auto;
          font-size: 0.8rem;
          color: #9ca3af;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.15s;
        }
        .celebrate-decline:hover {
          color: #4b5563;
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

        {/* Top-Level Tabs Switcher */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: "24px", gap: "8px" }}>
          <button 
            type="button" 
            className={`contacts-tab ${activeSidebarTab === "messages" ? "active" : ""}`} 
            onClick={() => {
              setActiveSidebarTab("messages");
              setSelectedMatch(null);
            }}
            style={{ width: "auto", flex: "none", padding: "12px 24px" }}
          >
            Messages
          </button>
          <button 
            type="button" 
            className={`contacts-tab ${activeSidebarTab === "matches" ? "active" : ""}`} 
            onClick={() => {
              setActiveSidebarTab("matches");
              setActiveThreadId(null);
            }}
            style={{ width: "auto", flex: "none", padding: "12px 24px" }}
          >
            Matches ({matches.filter(m => m.status !== 'rejected' && m.status !== 'converted').length})
          </button>
        </div>

        <div className="msg-layout">
          {activeSidebarTab === "messages" ? (
            <>
              {/* LEFT PANEL: ACTIVE CHAT WINDOW */}
              <div className="chat-panel">
                {activeThread ? (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    {/* Chat Partner Details Header styled EXACTLY like the Matches header */}
                    {(() => {
                      const partnerMatch = matches.find(m => m.partner.id === activeThread.partnerId);
                      const initial = activeThread.partnerName ? activeThread.partnerName[0].toUpperCase() : "?";
                      return (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", borderBottom: "1px solid #e5e7eb", padding: "18px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <div style={{ 
                              width: "60px", 
                              height: "60px", 
                              borderRadius: "50%", 
                              background: "linear-gradient(135deg, #f17c13 0%, #ffedd5 100%)", 
                              color: "white", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              fontWeight: "700", 
                              fontSize: "1.5rem",
                              overflow: "hidden",
                              flexShrink: 0
                            }}>
                              {activeThread.partnerPhoto ? (
                                <img src={activeThread.partnerPhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                initial
                              )}
                            </div>
                            <div>
                              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#111827", cursor: "pointer" }} onClick={() => navigate(`/profile/${activeThread.partnerId}`)}>
                                {activeThread.partnerName}
                              </h3>
                              <div style={{ fontSize: "0.85rem", color: "#4b5563", marginTop: "2px" }}>
                                {activeThread.partnerRole || "B2B Partner"} @ <strong>{activeThread.partnerCompany || "N/A"}</strong>
                              </div>
                            </div>
                          </div>
                          
                          {/* Turn Badge styled like Compatibility Badge */}
                          {(() => {
                            const latestMsg = activeThread.messages[activeThread.messages.length - 1];
                            let turnText = "New Connection";
                            if (latestMsg) {
                              if (latestMsg.direction === "incoming") {
                                turnText = "Your Turn";
                              } else {
                                turnText = "Awaiting Reply";
                              }
                            }
                            return (
                              <div style={{ 
                                background: "#fffbeb", 
                                color: "#d97706", 
                                fontWeight: "750", 
                                fontSize: "0.8rem", 
                                padding: "6px 12px", 
                                borderRadius: "20px", 
                                border: "1px solid #fef3c7" 
                              }}>
                                {turnText}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()}

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
                    <div className="msg-detail-empty-icon">
                      <MessageSquare size={36} />
                    </div>
                    <h3 className="msg-detail-empty-title">Select a Conversation</h3>
                    <p className="msg-detail-empty-text">
                      Choose an active conversation from the sidebar to view chat history and negotiate B2B deals.
                    </p>
                  </div>
                )}
              </div>

              {/* RIGHT PANEL: CONVERSATIONS SIDEBAR LIST */}
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
                    <div style={{ 
                      margin: "20px 16px",
                      padding: "32px 16px", 
                      color: "#6b7280", 
                      textAlign: "center", 
                      border: "1px dashed #e5e7eb", 
                      borderRadius: "12px", 
                      background: "#fafafb" 
                    }}>
                      <Inbox size={28} style={{ color: "#9ca3af", marginBottom: "8px", opacity: 0.7 }} />
                      <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#374151" }}>No active chats yet</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "4px", lineHeight: 1.4 }}>
                        Go to the "Matches" tab above to find and connect with partners.
                      </div>
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
                            setSelectedMatch(null);
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
            </>
                          ) : (
            /* MATCHES VIEW */
            <>
              {/* LEFT PANEL: MATCH SYNERGY DETAILS */}
              <div className="chat-panel" style={{ overflowY: "auto" }}>
                {selectedMatch ? (() => {
                  const hasAccepted = (currentUserId === selectedMatch.user_id_1 && selectedMatch.status === "accepted_1") ||
                                      (currentUserId === selectedMatch.user_id_2 && selectedMatch.status === "accepted_2");
                  return (
                    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
                      {/* Header card formatted with avatar and details */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", borderBottom: "1px solid #e5e7eb", padding: "18px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{ 
                            width: "60px", 
                            height: "60px", 
                            borderRadius: "50%", 
                            background: "linear-gradient(135deg, #f17c13 0%, #ffedd5 100%)", 
                            color: "white", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            fontWeight: "700", 
                            fontSize: "1.5rem",
                            overflow: "hidden",
                            flexShrink: 0
                          }}>
                            {selectedMatch.partner.photo ? (
                              <img src={selectedMatch.partner.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              selectedMatch.partner.first_name ? selectedMatch.partner.first_name[0].toUpperCase() : "?"
                            )}
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700", color: "#111827" }}>
                              {selectedMatch.partner.first_name} {selectedMatch.partner.last_name}
                            </h3>
                            <div style={{ fontSize: "0.85rem", color: "#4b5563", marginTop: "2px" }}>
                              {selectedMatch.partner.role || "B2B Partner"} @ <strong>{selectedMatch.partner.company_name || "N/A"}</strong>
                            </div>
                          </div>
                        </div>
                        
                        {/* Badge */}
                        <div style={{ 
                          background: "#fffbeb", 
                          color: "#d97706", 
                          fontWeight: "750", 
                          fontSize: "0.8rem", 
                          padding: "6px 12px", 
                          borderRadius: "20px", 
                          border: "1px solid #fef3c7" 
                        }}>
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
                        whiteSpace: "pre-line"
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
                        lineHeight: 1.5
                      }}>
                        {selectedMatch.match_reason}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "12px" }}>
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
                          onClick={() => {
                            updateMatchStatus(selectedMatch.id, "accept")
                              .then((res) => {
                                loadMessages(selectedMatch.partner.id);
                                getMatches().then(setMatches);
                                setSelectedMatch(null);
                                setActiveSidebarTab("messages");
                              })
                              .catch(err => console.error("Error accepting match:", err));
                          }}
                        >
                          Connect & start chatting!
                        </button>
                      )}
                      <button 
                        type="button" 
                        className="ps-btn-secondary" 
                        style={{ padding: "12px 24px", borderRadius: "12px", width: "auto", color: "#ef4444", borderColor: "#fecaca" }}
                        onClick={() => {
                          if (window.confirm("Are you sure you want to ignore this lead match?")) {
                            updateMatchStatus(selectedMatch.id, "reject")
                              .then(() => {
                                getMatches().then(setMatches);
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
                  <div className="msg-detail-empty">
                    <div className="msg-detail-empty-icon">
                      <MessageSquare size={36} />
                    </div>
                    <h3 className="msg-detail-empty-title">Select a B2B Match</h3>
                    <p className="msg-detail-empty-text">
                      Choose a matched candidate from the sidebar to inspect their B2B intentions, synergy score, and connect.
                    </p>
                  </div>
                )}
              </div>

              {/* RIGHT PANEL: NEW B2B MATCHES SIDEBAR LIST */}
              <div className="contacts-panel">
                <div className="contacts-header">
                  New B2B Matches
                </div>
                <div className="contacts-items">
                  {(() => {
                    const pendingMatches = matches.filter(m => m.status !== 'rejected' && m.status !== 'converted');
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
                                  {m.partner.company_name || "B2B Partner"}
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
            </>
          )}
        </div>
      </div>


      <Footer />
    </div>
  );
}
