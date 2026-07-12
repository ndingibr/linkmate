import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MessageSquare, Send, Play, AlertCircle, TrendingUp, CheckCircle, RefreshCw, Sparkles, Brain, User, LogOut, Menu, X } from "lucide-react";
import logoImg from "./img/ventureai_logo.jpg";
import { isAuthenticated, logout } from "./api";

export default function EarningsPredictor() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [showChartTable, setShowChartTable] = useState({});
  const [activeSymbol, setActiveSymbol] = useState("");
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [analyzingSymbol, setAnalyzingSymbol] = useState("");
  
  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Welcome! Tap any company card to run an analysis, or ask me questions like \"which company has entry day today?\" or \"show me the graph for AAPL\"",
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Initialize auth, candidates and predictions
  useEffect(() => {
    setAuth(isAuthenticated());
    fetchCandidates();
    fetchPredictions();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const fetchCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const res = await axios.get("/earnings/rally/candidates");
      setCandidates(res.data.candidates || []);
      if (res.data.candidates?.length > 0) {
        setActiveSymbol(res.data.candidates[0].symbol);
      }
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      const res = await axios.get("/earnings/rally/predictions");
      setPredictions(res.data.predictions || []);
    } catch (err) {
      console.error("Failed to fetch predictions:", err);
    }
  };

  const handleSelectCandidate = async (candidate) => {
    setActiveSymbol(candidate.symbol);
    
    // Check if prediction is already loaded in predictions database
    const existing = predictions.find((p) => p.symbol === candidate.symbol && Array.isArray(p.actual_trajectory) && p.actual_trajectory.length > 0);
    if (existing) {
      // Add existing prediction chart inside the chat history
      setMessages((prev) => [
        ...prev,
        {
          sender: "user",
          text: `Show me forecast details for ${candidate.symbol}`,
        },
        {
          sender: "bot",
          text: `📈 Here is the saved forecast and drift analysis for **${candidate.company_name} (${candidate.symbol})**: \n\n${existing.llm_reasoning}`,
          candDetails: candidate
        }
      ]);
      return;
    }

    // Otherwise, trigger the analysis run
    setAnalyzingSymbol(candidate.symbol);
    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: `Analyze upcoming earnings for ${candidate.symbol}`,
      },
      {
        sender: "bot",
        text: `🔄 Fetching historical returns (Day -10 to Day +10) for ${candidate.symbol} and optimizing trade entry/exit target days via GPT-4o-mini...`,
      },
    ]);
    
    try {
      const res = await axios.post("/earnings/rally/analyze", {
        symbol: candidate.symbol,
      });
      
      if (res.data.status === "success") {
        // Fetch fresh predictions list to keep synced
        const freshRes = await axios.get("/earnings/rally/predictions");
        const freshList = freshRes.data.predictions || [];
        setPredictions(freshList);
        
        const predictionRecord = freshList.find((p) => p.symbol === candidate.symbol);
        
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `✅ Analysis complete! **${candidate.company_name} (${candidate.symbol})** is scheduled for earnings on **${candidate.earnings_date}**. Based on historical cycles, we expect a net gain of **+${res.data.forecast.expected_return_pct}%** using our optimized timing model.`,
            candDetails: candidate
          }
        ]);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `❌ Forecast analysis failed for ${candidate.symbol}: ${err.response?.data?.detail || err.message}`,
        },
      ]);
    } finally {
      setAnalyzingSymbol("");
    }
  };

  const handleSendChat = async (textToSend) => {
    const queryText = textToSend || chatInput;
    if (!queryText.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: queryText }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await axios.post("/earnings/rally/chat", {
        query: queryText,
        symbol: activeSymbol,
      });

      // Auto-attach prediction chart if the query mentions a known symbol or asks for a graph
      const queryLower = queryText.toLowerCase();
      const graphKeywords = ["graph", "chart", "show", "plot", "trajectory", "prediction", "forecast"];
      const wantsGraph = graphKeywords.some(k => queryLower.includes(k));

      let matchedPrediction = null;
      if (wantsGraph) {
        // Smart check if user query mentions a specific symbol or company name (including Google/GOOGL aliases)
        for (const p of predictions) {
          const sym = p.symbol.toLowerCase();
          const name = p.company_name.toLowerCase();
          if (
            queryLower.includes(sym) ||
            queryLower.includes(name) ||
            (sym === "googl" && queryLower.includes("google")) ||
            (name.includes("google") && queryLower.includes("google"))
          ) {
            matchedPrediction = p;
            break;
          }
        }
        // If no specific symbol matched but they want a graph, use the active symbol
        if (!matchedPrediction && activeSymbol) {
          matchedPrediction = predictions.find(p => p.symbol === activeSymbol);
        }
      }

      setMessages((prev) => [...prev, {
        sender: "bot",
        text: res.data.reply,
        prediction: matchedPrediction || undefined,
      }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I had trouble processing that query. Please verify that the backend is running.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const renderChatSvgChart = (pred) => {
    if (!pred) return null;
    const trajectory = Array.isArray(pred.predicted_trajectory) ? pred.predicted_trajectory : [];
    const pointsCount = 21;
    const width = 500;
    const height = 260;
    const padding = { top: 30, right: 25, bottom: 40, left: 45 };

    const candidate = candidates.find(c => c.symbol === pred.symbol);
    const baseDateStr = candidate ? candidate.earnings_date : null;

    const getRelativeDateStr = (base, offsetDays) => {
      if (!base) return "";
      try {
        const baseDateObj = new Date(base + "T12:00:00");
        if (isNaN(baseDateObj.getTime())) return "";
        const calendarOffset = Math.round(offsetDays * 1.4);
        const target = new Date(baseDateObj.getTime() + calendarOffset * 24 * 60 * 60 * 1000);
        return target.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } catch (e) {
        return "";
      }
    };

    const entryDateStr = getRelativeDateStr(baseDateStr, pred.optimal_entry_day);
    const exitDateStr = getRelativeDateStr(baseDateStr, pred.optimal_exit_day);

    const predData = [];
    for (let i = -10; i <= 10; i++) {
      let val = 0.0;
      if (i > 0) {
        val = trajectory[i - 1] || 0.0;
      }
      predData.push({ day: i, val });
    }

    const actualData = [];
    const dbActuals = pred.actual_trajectory || [];
    for (let i = -10; i <= 10; i++) {
      const match = dbActuals.find((item) => item.day === i);
      if (match) {
        actualData.push({ day: i, val: match.return_pct });
      }
    }

    const allVals = [...predData.map(d => d.val), ...actualData.map(d => d.val)];
    const maxVal = Math.max(...allVals, 0.05);
    const minVal = Math.min(...allVals, -0.05);
    const valRange = maxVal - minVal;

    const getX = (day) => {
      const step = (width - padding.left - padding.right) / (pointsCount - 1);
      return padding.left + (day + 10) * step;
    };
    
    const getY = (val) => {
      const chartHeight = height - padding.top - padding.bottom;
      return padding.top + chartHeight - ((val - minVal) / valRange) * chartHeight;
    };

    const drawPath = (data) => {
      if (data.length === 0) return "";
      return data.map((d, idx) => {
        const x = getX(d.day);
        const y = getY(d.val);
        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
      }).join(" ");
    };

    const predPath = drawPath(predData);
    const actualPath = drawPath(actualData);

    // Calculate error levels
    let maeStr = "N/A";
    let accStr = "N/A";
    if (dbActuals.length > 0) {
      let sumAbs = 0.0;
      let count = 0;
      dbActuals.forEach((act) => {
        if (act.day > 0) {
          const pVal = trajectory[act.day - 1] || 0.0;
          sumAbs += Math.abs(pVal - act.return_pct);
          count++;
        }
      });
      if (count > 0) {
        const mae = sumAbs / count;
        maeStr = `${(mae * 100).toFixed(2)}%`;
        accStr = `${Math.max(0, 100 - (mae * 100)).toFixed(1)}%`;
      }
    }

    return (
      <div 
        style={{ 
          marginTop: "12px", 
          padding: "16px", 
          background: "linear-gradient(135deg, #1b1b1f 0%, #0d0d0f 100%)", 
          borderRadius: "14px", 
          border: "1px solid rgba(241, 124, 19, 0.3)", 
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.5)",
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#e2e8f0", marginBottom: "12px", flexWrap: "wrap", gap: "6px" }}>
          <span>Entry: <strong style={{ color: "rgb(241, 124, 19)" }}>D{pred.optimal_entry_day} ({entryDateStr || "N/A"})</strong></span>
          <span>Exit: <strong style={{ color: "#ffffff" }}>D+{pred.optimal_exit_day} ({exitDateStr || "N/A"})</strong></span>
          <span>Return: <strong style={{ color: "#10b981", fontWeight: "bold" }}>+{pred.expected_return_pct}%</strong></span>
        </div>

        <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
          <defs>
            <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-white" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {[-0.05, 0.0, 0.05, 0.10].map((level, idx) => {
            if (level < minVal || level > maxVal) return null;
            const y = getY(level);
            return (
              <g key={idx}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="3,3" />
                <text x={8} y={y + 4} fill="#a1a1aa" fontSize="11">{(level * 100).toFixed(0)}%</text>
              </g>
            );
          })}

          <line x1={getX(0)} y1={padding.top} x2={getX(0)} y2={height - padding.bottom} stroke="#f17c13" strokeWidth={1} strokeOpacity={0.4} strokeDasharray="4,4" />
          <text x={getX(0) + 4} y={padding.top + 12} fill="#f17c13" fontSize="11" fontWeight="bold">Earnings</text>

          {/* Today marker - calculate which day offset 'today' falls on */}
          {(() => {
            if (!baseDateStr) return null;
            try {
              const today = new Date();
              today.setHours(12, 0, 0, 0);
              const baseDate = new Date(baseDateStr + "T12:00:00");
              const diffMs = today.getTime() - baseDate.getTime();
              const diffCalendarDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
              const todayDayOffset = Math.round(diffCalendarDays / 1.4);
              if (todayDayOffset >= -10 && todayDayOffset <= 10) {
                return (
                  <g>
                    <line x1={getX(todayDayOffset)} y1={padding.top} x2={getX(todayDayOffset)} y2={height - padding.bottom} stroke="#22d3ee" strokeWidth={1.5} strokeOpacity={0.7} />
                    <text x={getX(todayDayOffset) + 4} y={padding.top + 28} fill="#22d3ee" fontSize="11" fontWeight="bold">Today</text>
                  </g>
                );
              }
              return null;
            } catch (e) { return null; }
          })()}
          
          {/* Target points */}
          <circle cx={getX(pred.optimal_entry_day)} cy={getY(predData.find(d => d.day === pred.optimal_entry_day)?.val || 0)} r={5.5} fill="rgb(241, 124, 19)" stroke="#111" strokeWidth={1} />
          <text x={getX(pred.optimal_entry_day) - 10} y={getY(predData.find(d => d.day === pred.optimal_entry_day)?.val || 0) - 9} fill="rgb(241, 124, 19)" fontSize="11" fontWeight="bold">BUY</text>
          <circle cx={getX(pred.optimal_exit_day)} cy={getY(predData.find(d => d.day === pred.optimal_exit_day)?.val || 0)} r={5.5} fill="#ffffff" stroke="#111" strokeWidth={1} />
          <text x={getX(pred.optimal_exit_day) - 10} y={getY(predData.find(d => d.day === pred.optimal_exit_day)?.val || 0) - 9} fill="#ffffff" fontSize="11" fontWeight="bold">SELL</text>

          {predPath && <path d={predPath} fill="none" stroke="#f17c13" strokeWidth={2.5} strokeDasharray="3,2" filter="url(#glow-orange)" />}
          {actualPath && <path d={actualPath} fill="none" stroke="#ffffff" strokeWidth={2.5} filter="url(#glow-white)" />}

          {[-10, -5, 0, 5, 10].map((day, idx) => {
            const dateStr = getRelativeDateStr(baseDateStr, day);
            return (
              <g key={idx}>
                <text x={getX(day) - 10} y={height - 23} fill="#71717a" fontSize="11" fontWeight="bold">
                  {day > 0 ? `+${day}` : day}d
                </text>
                {dateStr && (
                  <text x={getX(day) - 20} y={height - 8} fill="rgba(255, 255, 255, 0.45)" fontSize="10">
                    {dateStr}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        
        {/* Legend */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", fontSize: "0.65rem", marginTop: "6px", color: "#a1a1aa", flexWrap: "wrap" }}>
          <span><span style={{ display: "inline-block", width: "8px", borderTop: "1.5px dashed #f17c13" }}></span> Predicted</span>
          {actualData.length > 0 && <span><span style={{ display: "inline-block", width: "8px", borderTop: "1.5px solid #ffffff" }}></span> Actual</span>}
          <span><span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "rgb(241, 124, 19)" }}></span> Entry (BUY)</span>
          <span><span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#ffffff" }}></span> Exit (SELL)</span>
          <span><span style={{ display: "inline-block", width: "8px", borderTop: "1.5px solid #22d3ee" }}></span> Today</span>
        </div>

      </div>
    );
  };

  return (
    <div className="earnings-predictor-page">
      <style>{`
        .earnings-predictor-page {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: rgb(17, 17, 17);
          color: #ffffff;
          font-family: 'Poppins', sans-serif;
          box-sizing: border-box;
          overflow: hidden;
        }

        /* Simplified 2-Panel Layout Grid */
        .dashboard-container {
          display: flex;
          flex: 1;
          margin: 1.5rem;
          gap: 1.25rem;
          box-sizing: border-box;
          overflow: hidden;
        }

         .panel-card {
          background-color: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .panel-left-candidates {
          width: 320px;
          flex-shrink: 0;
        }

        .panel-center-chat {
          flex: 1;
        }

        /* Sidebar Elements */
        .sidebar-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sidebar-title {
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: rgb(241, 124, 19);
          margin: 0;
        }

        .candidates-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .candidate-item {
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .candidate-item.active {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(241, 124, 19, 0.4);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .candidate-item:hover:not(.active) {
          background-color: rgba(255, 255, 255, 0.04);
          border-color: rgba(241, 124, 19, 0.4);
        }

        .badge-rally {
          background-color: rgba(241, 124, 19, 0.1);
          color: #f17c13;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 6px;
          display: inline-block;
        }

        .card-details-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          margin-top: 6px;
          color: #9ca3af;
        }

        /* Chat Console */
        .chat-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: transparent;
        }

        .chat-messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .chat-message {
          display: flex;
          flex-direction: column;
          max-width: 85%;
          animation: slideUp 0.25s ease;
        }

        .chat-message.bot {
          align-self: flex-start;
        }

        .chat-message.user {
          align-self: flex-end;
        }

        .message-bubble {
          border-radius: 16px;
          padding: 0.9rem 1.15rem;
          font-size: 0.88rem;
          line-height: 1.5;
          text-align: left;
        }

        .chat-message.bot .message-bubble {
          background-color: rgba(255, 255, 255, 0.02);
          color: #ffffff;
          border-bottom-left-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .chat-message.user .message-bubble {
          background-color: #f17c13;
          color: #ffffff;
          border-bottom-right-radius: 4px;
        }

        .message-sender {
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #9ca3af;
          margin-bottom: 4px;
          padding: 0 4px;
        }

        .chat-message.user .message-sender {
          align-self: flex-end;
        }

        .chat-input-wrapper {
          padding: 1rem 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          background-color: transparent;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .chat-input-container {
          display: flex;
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 4px;
          align-items: center;
        }

        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #ffffff;
          padding: 0.65rem 0.9rem;
          outline: none;
          font-size: 0.88rem;
        }

        .chat-send-btn {
          background: linear-gradient(135deg, #f17c13 0%, #d96a0a 100%);
          color: #ffffff;
          border: none;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .chat-send-btn:hover {
          background: #ff9d42;
        }

        .chat-pills-row {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .chat-pill {
          background-color: rgba(241, 124, 19, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 0.7rem;
          color: #f17c13;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .chat-pill:hover {
          background-color: #f17c13;
          color: #ffffff;
          border-color: #f17c13;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .earnings-predictor-page {
            height: auto;
            min-height: 100vh;
            overflow-y: auto;
          }

          .dashboard-container {
            flex-direction: column;
            margin: 0.5rem;
            gap: 1rem;
            height: auto;
            overflow: visible;
          }

          .panel-left-candidates {
            width: 100%;
            background: transparent !important;
            border: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            border-radius: 0;
            box-shadow: none !important;
          }

          /* Horizontal scrolling carousel of cards on mobile */
          .candidates-list {
            display: flex;
            flex-direction: row !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            scroll-snap-type: x mandatory;
            gap: 12px;
            padding: 8px 4px !important;
            -webkit-overflow-scrolling: touch;
          }

          /* Custom scrollbar layout for horizontal carousel list */
          .candidates-list::-webkit-scrollbar {
            height: 4px;
          }
          .candidates-list::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 2px;
          }
          .candidates-list::-webkit-scrollbar-thumb {
            background: rgba(241, 124, 19, 0.4);
            border-radius: 2px;
          }

          .panel-center-chat {
            width: 100%;
            height: 600px;
          }

          /* Redesign text sizes for mobile reader compatibility */
          .message-bubble {
            font-size: 1rem !important;
            line-height: 1.6;
          }

          .chat-input {
            font-size: 1rem !important;
          }

          .chat-message {
            max-width: 95% !important;
          }

          .candidate-item {
            flex: 0 0 88%;
            scroll-snap-align: start;
            box-sizing: border-box;
            margin-bottom: 0 !important;
            padding: 1.1rem;
          }

          .candidate-item h4 {
            font-size: 1.15rem !important;
          }

          .card-details-row {
            font-size: 0.85rem !important;
            margin-top: 8px;
          }

          .badge-rally {
            font-size: 0.75rem !important;
            padding: 3px 8px;
          }
        }
      `}</style>

      {/* Header Navigation */}
      <nav className="main-nav-header">
        {/* Logo */}
        <div onClick={() => navigate("/")} className="main-nav-logo">
          <img
            src={logoImg}
            alt="Logo"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "2px solid #ffffff",
            }}
          />
          <span>
            venture<span style={{ color: "#1F2937" }}>ai</span>
          </span>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button className="main-nav-toggle-btn" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Navigation Items */}
        <div className={`main-nav-items-wrapper ${menuOpen ? "open" : ""}`}>
          <span onClick={() => { navigate("/"); setMenuOpen(false); }} style={{ cursor: "pointer", color: "#ffffff", fontWeight: "500", fontSize: "0.95rem" }}>
            Home
          </span>
          <span onClick={() => { navigate("/search"); setMenuOpen(false); }} style={{ cursor: "pointer", color: "#ffffff", fontWeight: "500", fontSize: "0.95rem" }}>
            Products
          </span>
          <span onClick={() => { navigate("/earnings-predictor"); setMenuOpen(false); }} style={{ cursor: "pointer", color: "#ffffff", fontWeight: "600", fontSize: "0.95rem" }}>
            Rally Predictor
          </span>

          <div className="main-nav-auth-group">
            {auth ? (
              <>
                <button
                  onClick={() => { navigate("/profile"); setMenuOpen(false); }}
                  style={{
                    backgroundColor: "transparent",
                    color: "#ffffff",
                    border: "1px solid #ffffff",
                    padding: "0.5rem 1.2rem",
                    borderRadius: "20px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    logout();
                    setAuth(false);
                    setMenuOpen(false);
                    navigate("/login");
                  }}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.5rem 1.2rem",
                    borderRadius: "20px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { navigate("/login"); setMenuOpen(false); }}
                  style={{
                    backgroundColor: "transparent",
                    color: "#ffffff",
                    border: "1px solid #ffffff",
                    padding: "0.5rem 1.2rem",
                    borderRadius: "20px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => { navigate("/register"); setMenuOpen(false); }}
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#f17c13",
                    border: "none",
                    padding: "0.5rem 1.2rem",
                    borderRadius: "20px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 2-COLUMN DASHBOARD WORKSPACE */}
      <div className="dashboard-container">
        {/* LEFT PANEL: COMPANY LIST */}
        <div className="panel-card panel-left-candidates">

          <div className="candidates-list" style={{ overflow: "hidden" }}>
            {loadingCandidates ? (
              <div style={{ color: "#71717a", fontSize: "0.8rem", padding: "1rem" }}>Retrieving candidates...</div>
            ) : (
              candidates.map((c) => {
                const dbMatch = predictions.find((p) => p.symbol === c.symbol);
                const isSelected = activeSymbol === c.symbol;
                return (
                  <div
                    key={c.symbol}
                    className={`candidate-item ${isSelected ? "active" : ""}`}
                    onClick={() => handleSelectCandidate(c)}
                    style={{
                      padding: "0.3rem 0.65rem",
                      borderRadius: "10px",
                      marginBottom: "0.15rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "700", fontSize: "0.82rem" }}>{c.symbol}</span>
                      <span className="badge-rally" style={{ fontSize: "0.6rem", padding: "1px 4px" }}>
                        {(c.win_rate * 100).toFixed(0)}% Win
                      </span>
                    </div>
                    
                    <div style={{ fontSize: "0.7rem", color: "#a1a1aa", marginTop: "1px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {c.company_name}
                    </div>

                    <div style={{ fontSize: "0.68rem", color: "rgb(241, 124, 19)", marginTop: "2px", fontWeight: "500" }}>
                      Earnings: {c.earnings_date || "N/A"}
                    </div>

                    <div className="card-details-row" style={{ marginTop: "3px", fontSize: "0.7rem" }}>
                      <span>Price: <strong>${c.current_price ? c.current_price.toFixed(2) : "N/A"}</strong></span>
                      {dbMatch ? (
                        <span style={{ color: "rgb(241, 124, 19)", fontWeight: "700" }}>+{dbMatch.expected_return_pct}%</span>
                      ) : (
                        <span style={{ color: "#f17c13" }}>New</span>
                      )}
                    </div>

                    <div className="card-details-row" style={{ borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "3px", marginTop: "3px", fontSize: "0.7rem" }}>
                      {dbMatch ? (
                        <>
                          <span style={{ color: "rgb(241, 124, 19)" }}>Buy: D{dbMatch.optimal_entry_day}</span>
                          <span style={{ color: "#ffffff" }}>Sell: D+{dbMatch.optimal_exit_day}</span>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCandidate(c);
                          }}
                          disabled={analyzingSymbol === c.symbol}
                          style={{
                            backgroundColor: "#f17c13",
                            border: "none",
                            color: "#fff",
                            fontSize: "0.6rem",
                            fontWeight: "600",
                            padding: "1.5px 5px",
                            borderRadius: "3px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "2px",
                            width: "100%",
                            justifyContent: "center"
                          }}
                        >
                          {analyzingSymbol === c.symbol ? (
                            <RefreshCw size={8} style={{ animation: "spin 1s linear infinite" }} />
                          ) : (
                            <Play size={6} fill="#fff" />
                          )}
                          Analyze
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: CHAT WINDOW WITH RICH INLINE CHARTS */}
        <div className="panel-card panel-center-chat">


          <div className="chat-messages-container">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`chat-message ${m.sender}`}
                style={m.prediction ? { width: "100%" } : {}}
              >
                <span className="message-sender">{m.sender === "bot" ? "Assistant" : "You"}</span>
                <div className="message-bubble">
                  {m.text}
                </div>
                {/* Rich inline chart injection rendered outside the bubble for full width & high contrast visibility */}
                {m.prediction && renderChatSvgChart(m.prediction)}
              </div>
            ))}
            {chatLoading && (
              <div className="chat-message bot">
                <span className="message-sender">Assistant</span>
                <div className="message-bubble" style={{ display: "flex", gap: "4px", padding: "0.5rem 0.8rem", width: "fit-content" }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#a1a1aa", animation: "bounce 0.6s infinite 0.1s" }}></span>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#a1a1aa", animation: "bounce 0.6s infinite 0.2s" }}></span>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#a1a1aa", animation: "bounce 0.6s infinite 0.3s" }}></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-wrapper">

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="chat-input-container"
            >
              <input
                type="text"
                className="chat-input"
                placeholder={`Ask about ${activeSymbol} earnings forecast targets...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
              />
              <button type="submit" className="chat-send-btn" disabled={chatLoading}>
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
