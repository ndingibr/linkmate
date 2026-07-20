import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getUserProfile, updateUserProfile, logout, analyzeIntent, isAuthenticated, getOtherUserProfile, getInboxMessages, getSentMessages, sendMessage, markMessageRead, getMatches } from "./api";
import logoImg from "./img/small_circles.jpg";
import { Menu, X, Mail, Send, Inbox, MessageSquare, Reply } from "lucide-react";
import Footer from "./components/Footer";
import Header from "./components/Header";

export default function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isReadOnly = !!id;
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("intent");
  const [matches, setMatches] = useState([]);
  const location = useLocation();

  // Read tab parameter on load/change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["intent", "profile"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);

  // Form State
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    company_name: "",
    intent: "",
    role: "",
    influence: "Recommend / Influence",
    has_budget: false,
    budget_min: "",
    budget_max: "",
    budget_currency: "ZAR",
    comm_channel: "Email",
    comm_hours: "Work hours",
    intent_lifespan: "90 Days",
    location: "",
    intent_active: true,
    photo: ""
  });

  // AI Evaluation State
  const [aiScore, setAiScore] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiClarity, setAiClarity] = useState("");
  const [aiMetrics, setAiMetrics] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Location Autocomplete
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const COMMON_LOCATIONS = [
    "Sandton, Johannesburg", "Centurion, Pretoria", "Stellenbosch, Cape Town",
    "Umhlanga, Durban", "Randburg, Johannesburg", "Rosebank, Johannesburg",
    "Midrand, Johannesburg", "Pretoria East, Pretoria", "Cape Town City Centre",
    "Bellville, Cape Town", "Somerset West, Cape Town", "Durban North, Durban",
    "Gqeberha (Port Elizabeth)", "Bloemfontein, Free State", "Polokwane, Limpopo",
    "Nelspruit (Mbombela), Mpumalanga", "Rustenburg, North West", "George, Garden Route",
    "Knysna, Garden Route", "Pietermaritzburg, KwaZulu-Natal", "East London, Eastern Cape",
    "Soweto, Johannesburg", "Johannesburg, Gauteng", "Cape Town, Western Cape",
    "Durban, KwaZulu-Natal", "Pretoria, Gauteng",
    "South Africa", "Worldwide (All Regions)", "Africa Continent",
    "Europe (EU Region)", "North America (US & Canada)", "Asia-Pacific Region",
    "United Kingdom", "United States"
  ];

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const fetchProfile = isReadOnly ? getOtherUserProfile(id) : getUserProfile();
    
    fetchProfile
      .then((data) => {
        setProfile(data);
        const initialIntent = data.intent || (!isReadOnly ? localStorage.getItem("pending_intent") : "") || "";
        setForm({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone || "",
          company_name: data.company_name || "",
          intent: initialIntent,
          role: data.role || "",
          influence: data.influence || "Recommend / Influence",
          has_budget: data.has_budget || false,
          budget_min: data.budget_min || "",
          budget_max: data.budget_max || "",
          budget_currency: data.budget_currency || "ZAR",
          comm_channel: data.comm_channel || "Email",
          comm_hours: data.comm_hours || "Work hours",
          intent_lifespan: data.intent_lifespan || "90 Days",
          location: data.location || "",
          intent_active: data.intent_active !== false,
          photo: data.photo || ""
        });
        if (initialIntent.trim()) triggerAiAnalysis(initialIntent);
      })
      .catch((err) => {
        console.error(err);
        if (isReadOnly) {
          setError("Failed to load partner profile. User may not exist or authentication expired.");
        } else {
          setError("Failed to load profile. Please login again.");
          logout();
          navigate("/login");
        }
      })
      .finally(() => setLoading(false));

    if (isReadOnly && isAuthenticated()) {
      getMatches()
        .then(setMatches)
        .catch(err => console.error("Failed to load matches on Profile:", err));
    }
  }, [navigate, id, isReadOnly]);

  const triggerAiAnalysis = async (queryText) => {
    if (!queryText.trim()) return;
    setAnalyzing(true);
    try {
      const result = await analyzeIntent(queryText);
      setAiScore(result.score);
      setAiClarity(result.clarity_level);
      setAiSuggestions(result.suggestions);
      setAiMetrics(result.strength_metrics || null);
    } catch (e) {
      console.warn("AI Analysis API failed, using client-side fallback:", e);
      const cleanText = queryText.toLowerCase().trim();
      const words = cleanText.split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;

      let domain = "General Business";
      if (["plumber","plumbing","pipe","leak","drain","geyser"].some(k => cleanText.includes(k))) domain = "Plumbing Service";
      else if (["car","vehicle","auto","truck","suv","motor"].some(k => cleanText.includes(k))) domain = "Automotive / Vehicle";
      else if (["software","developer","dev","app","programming","code","web","database","tech","engineer"].some(k => cleanText.includes(k))) domain = "Software / IT";

      const techKeywords = ["react","python","javascript","js","html","css","sql","aws","docker","git","c#","java","rust","go","node","php","stack","framework","database","api","django","flask","c++","ruby","vue","angular","typescript","swift","kotlin","flutter"];
      const hasTechStack = techKeywords.some(k => cleanText.includes(k));
      const timelineKeywords = ["hour","day","week","month","year","timeline","duration","estimate","budget","hourly","salary","contract","project","phase","deadline","milestone","full-time","part-time","remote","schedule"];
      const hasTimeline = timelineKeywords.some(k => cleanText.includes(k));
      const hasBackgroundDetails = ["experience","background","years","senior","junior","mid-level","expert","qualification","track record","portfolio","work history","resume"].some(k => cleanText.includes(k));
      const locationKeywords = ["johannesburg","cape town","durban","pretoria","sandton","gauteng","western cape","south africa","regional","national","remote","locality","city","hub","local","worldwide","continent","suburb"];
      const hasLocation = locationKeywords.some(k => cleanText.includes(k)) || form.location.trim().length > 0;

      let ethical = 95;
      if (["scam","hack","illegal","exploit","spam","pirate","bypass","fraud"].some(k => cleanText.includes(k))) ethical = 20;

      let professional = 50;
      if (wordCount >= 300) professional = 95;
      else if (wordCount >= 150) professional = 85;
      else if (wordCount >= 50) professional = 75;
      else if (wordCount >= 15) professional = 65;
      if (["gonna","wanna","lol","hey","bro","wtf","plz"].some(k => cleanText.includes(k))) professional = Math.max(20, professional - 30);

      let mutual = 40;
      if (["help","partner","collaborate","mutual","benefit","together","develop","provide","share","exchange"].some(k => cleanText.includes(k))) mutual = 75;
      if (["hire","pay","contract","compensate","equity"].some(k => cleanText.includes(k))) mutual = Math.min(100, mutual + 15);

      let reasonableness = 30;
      if (hasTimeline) reasonableness += 30;
      if (hasBackgroundDetails) reasonableness += 20;
      if (wordCount >= 80) reasonableness += 20;
      else if (wordCount >= 30) reasonableness += 10;
      if (["unlimited","immediate","asap","yesterday"].some(k => cleanText.includes(k))) reasonableness = Math.max(20, reasonableness - 15);
      reasonableness = Math.min(100, reasonableness);

      let alignment = 30;
      if (domain === "Software / IT") {
        if (["developer","software","app","design","build","code","programming","web","system","manager","admin"].some(k => cleanText.includes(k))) alignment += 20;
        if (hasTechStack) alignment += 30;
        if (hasBackgroundDetails) alignment += 20;
      } else if (domain === "Plumbing Service") {
        if (["plumber","plumbing","pipe","geyser","drain"].some(k => cleanText.includes(k))) alignment += 30;
        if (["cert","license","pirb"].some(k => cleanText.includes(k))) alignment += 20;
        if (["emergency","availability","available"].some(k => cleanText.includes(k))) alignment += 20;
      } else if (domain === "Automotive / Vehicle") {
        if (["car","vehicle","auto","truck","suv"].some(k => cleanText.includes(k))) alignment += 30;
        if (["toyota","ford","bmw","audi","mercedes","honda","nissan","hyundai","kia","volkswagen","vw"].some(k => cleanText.includes(k))) alignment += 20;
        if (cleanText.includes("year") || /\b(20\d{2})\b/.test(cleanText)) alignment += 20;
      } else {
        if (["developer","software","app","design","build","code","programming","web","system","manager","admin","marketer","consultant"].some(k => cleanText.includes(k))) alignment += 20;
        if (hasTechStack) alignment += 20;
        if (hasBackgroundDetails) alignment += 15;
      }
      if (hasLocation) alignment += 15;
      alignment = Math.min(100, alignment);

      let completeness = 10;
      if (wordCount >= 300) completeness += 40;
      else if (wordCount >= 150) completeness += 20;
      else if (wordCount >= 80) completeness += 10;
      if (hasLocation) completeness += 10;
      if (hasTechStack) completeness += 15;
      if (hasTimeline) completeness += 15;
      if (hasBackgroundDetails) completeness += 10;
      completeness = Math.max(10, Math.min(100, completeness));

      const score = Math.round((ethical + professional + mutual + reasonableness + alignment + completeness) / 6);
      let clarity = "Weak";
      if (score >= 75) clarity = "Strong";
      else if (score >= 45) clarity = "Moderate";

      const suggestions = [];
      if (wordCount < 300) suggestions.push(`Your statement is too short (${wordCount}/300 words). Expand to at least 300 words for optimal matchmaking.`);
      if (domain === "Plumbing Service") {
        if (!["leak","clog","burst","geyser","drain","toilet","repair","install","problem","sink","pipes"].some(k => cleanText.includes(k))) suggestions.push("Specify the plumbing problem details (e.g. geyser replacement, drain clog, toilet repair).");
        if (!hasBackgroundDetails) suggestions.push("State the plumber experience required (e.g., Senior trade-tested plumber, 5+ years).");
      } else if (domain === "Automotive / Vehicle") {
        if (!["toyota","ford","bmw","audi","mercedes","honda","nissan","hyundai","kia","volkswagen","vw","brand","make"].some(k => cleanText.includes(k))) suggestions.push("Include the specific vehicle make or brand you want to match.");
        if (!(cleanText.includes("year") || /\b(20\d{2})\b/.test(cleanText))) suggestions.push("Mention the model year or production age range of the vehicle.");
      } else if (domain === "Software / IT") {
        if (!hasTechStack) suggestions.push("Specify the required tools, languages, or tech stack (e.g. React, Python, AWS).");
        if (!hasTimeline) suggestions.push("Provide clear project timelines, milestones, or work estimates (e.g. 6-month contract, 20 hrs/week).");
      } else {
        const devContext = ["developer","software","app","design","build","code","programming","web","system","tech","platform","engineer"].some(k => cleanText.includes(k));
        if (!hasTechStack && devContext) suggestions.push("Specify the required tools, languages, or tech stack (e.g. React, Python, AWS).");
        if (!hasTimeline) suggestions.push("Provide clear project timelines, milestones, or work estimates (e.g. 6-month contract, 20 hrs/week).");
        if (!hasBackgroundDetails) suggestions.push("Describe the preferred background, experience levels, or past portfolio quality.");
      }
      if (!hasLocation) suggestions.push("Specify geographic region preferences or remote collaboration rules (e.g. Johannesburg, remote).");
      if (ethical < 50) suggestions.push("Ensure your intention statement uses professional, compliant business language.");

      setAiScore(score);
      setAiClarity(clarity);
      setAiSuggestions(suggestions.slice(0, 3));
      setAiMetrics({ ethical, professional, mutual_benefit: mutual, reasonableness, alignment, completeness });
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!form.intent || !form.intent.trim()) {
      setAiScore(null); setAiClarity(""); setAiSuggestions([]); setAiMetrics(null);
      return;
    }
    const t = setTimeout(() => triggerAiAnalysis(form.intent), 800);
    return () => clearTimeout(t);
  }, [form.intent]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    setError(""); setSuccess("");
    
    // Validate Location
    const loc = form.location;
    if (!loc || !loc.trim()) {
      setError("Location is mandatory.");
      return;
    }
    
    const clean = loc.toLowerCase().trim();
    let isSA = false;
    
    if (clean.includes("south africa") || clean.includes(" rsa") || clean.includes("rsa ") || clean.includes(", rsa") || clean.includes(", za") || clean.includes(" za ") || clean.endsWith(" za") || clean === "rsa" || clean === "za") {
      isSA = true;
    }
    
    const zipRegex = /\b\d{4}\b/;
    if (zipRegex.test(clean)) {
      isSA = true;
    }

    const saKeywords = [
      "gauteng", "western cape", "kwazulu-natal", "kzn", "eastern cape", "free state", "limpopo", "mpumalanga", "north west", "northern cape",
      "johannesburg", "joburg", "sandton", "randburg", "midrand", "roodepoort", "soweto", "kempton park", "benoni", "boksburg", "germiston", "alberton", "centurion", "pretoria", "tshwane",
      "cape town", "bellville", "stellenbosch", "somerset west", "paarl", "durban", "umhlanga", "pinetown", "pietermaritzburg", "gqeberha", "port elizabeth", "pe", "east london",
      "bloemfontein", "polokwane", "nelspruit", "mbembela", "rustenburg", "george", "knysna", "mossel bay", "hermanus", "parys", "welkom", "kimberley", "upington", "mafikeng", "potchefstroom",
      "klerksdorp", "witbank", "emalahleni", "middelburg", "secunda", "sasolburg", "vereeniging", "vanderbijlpark"
    ];
    
    if (saKeywords.some(keyword => clean.includes(keyword))) {
      isSA = true;
    }
    
    if (!isSA) {
      setError("Please specify a location within South Africa (e.g., zip code, suburb, city, or add 'South Africa').");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateUserProfile(form);
      setProfile(updated);
      setSuccess("Profile settings saved successfully!");
      localStorage.removeItem("pending_intent");
      if (form.intent.trim()) triggerAiAnalysis(form.intent);
    } catch (err) {
      setError("Failed to save profile settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const calculateExpiryDate = (lifespan) => {
    const days = parseInt(lifespan) || 90;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const getMeterColor = (score) => {
    if (score < 45) return "#ef4444";
    if (score < 75) return "#f17c13";
    return "#10b981";
  };

  const getInitials = () => {
    if (!profile) return "?";
    return `${(profile.first_name || "?")[0]}${(profile.last_name || "?")[0]}`.toUpperCase();
  };

  const handleLocationChange = (val) => {
    setForm({ ...form, location: val });
    if (val.trim()) {
      const filtered = COMMON_LOCATIONS.filter(loc => loc.toLowerCase().includes(val.toLowerCase()));
      setLocationSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const locationDropdown = (suggestions) => (
    <ul style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #d1d5db", borderRadius: "8px", padding: "6px 0", margin: 0, listStyle: "none", zIndex: 100, boxShadow: "0 10px 24px rgba(0,0,0,0.1)", maxHeight: "200px", overflowY: "auto" }}>
      {suggestions.map((loc, idx) => (
        <li key={idx}
          style={{ padding: "8px 14px", fontSize: "0.85rem", cursor: "pointer", color: "#374151", display: "flex", alignItems: "center", gap: "6px" }}
          onMouseDown={() => { setForm(f => ({ ...f, location: loc })); setLocationSuggestions([]); setShowSuggestions(false); }}
          onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >📍 {loc}</li>
      ))}
    </ul>
  );

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#fbf7f3" }}>
        <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#6b7280" }}>Loading profile settings...</p>
      </div>
    );
  }

  const wordCount = form.intent?.split(/\s+/).filter(w => w).length || 0;
  const currentPhoto = form.photo || profile?.photo;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#fbf7f3", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        /* ─── MAIN CONTAINER ─── */
        .ps-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          width: 100%;
        }

        /* ─── CONTENT (THINNER CARD LAYOUT) ─── */
        .ps-content {
          max-width: 960px;
          margin: 0 auto;
          width: 100%;
          padding: 28px 20px;
          flex: 1;
        }
        .ps-page-title { font-size: 2rem; font-weight: 800; color: #f17c13; margin: 20px 0 4px; }
        .ps-page-sub { font-size: 0.95rem; color: #5c4b36; margin: 0 0 22px; }

        /* ─── TABS ─── */
        .ps-tabs { display: flex; border-bottom: 2px solid #e5e7eb; margin-bottom: 24px; }
        .ps-tab {
          background: transparent; border: none;
          padding: 10px 18px; font-size: 0.875rem; font-weight: 600;
          color: #6b7280; cursor: pointer;
          border-bottom: 2px solid transparent; margin-bottom: -2px;
          display: flex; align-items: center; gap: 6px;
          transition: color 0.15s;
        }
        .ps-tab:hover { color: #374151; }
        .ps-tab.ps-active { color: #f17c13; border-bottom-color: #f17c13; }

        /* ─── CARDS ─── */
        .ps-card {
          background: #ffffff; border: 1px solid #e5e7eb;
          border-radius: 12px; padding: 28px 32px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .ps-card-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0 0 3px; }
        .ps-card-sub { font-size: 0.8rem; color: #5c4b36; margin: 0 0 20px; }
        .ps-divider { border: none; border-top: 1px solid #f1f5f9; margin: 0 0 22px; }

        /* ─── GRID ─── */
        .ps-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .ps-span-2 { grid-column: span 2; }

        /* ─── FIELDS ─── */
        .ps-field { display: flex; flex-direction: column; gap: 6px; }
        .ps-label { font-size: 0.82rem; font-weight: 600; color: #374151; }
        .ps-input {
          padding: 9px 13px; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 0.875rem; color: #111827; background: #ffffff;
          outline: none; width: 100%; font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .ps-input:focus { border-color: #f17c13; box-shadow: 0 0 0 3px rgba(241,124,19,0.1); }
        .ps-input:disabled { background: #f9fafb; color: #9ca3af; cursor: not-allowed; }
        .ps-textarea {
          padding: 10px 13px; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 0.875rem; color: #111827; background: #ffffff;
          outline: none; width: 100%; resize: none; line-height: 1.6;
          font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .ps-textarea:focus { border-color: #f17c13; box-shadow: 0 0 0 3px rgba(241,124,19,0.1); }
        .ps-select {
          padding: 9px 13px; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 0.875rem; color: #111827; background: #ffffff;
          outline: none; width: 100%; font-family: inherit;
          appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg fill='%236b7280' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
          background-repeat: no-repeat; background-position: right 10px center;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .ps-select:focus { border-color: #f17c13; box-shadow: 0 0 0 3px rgba(241,124,19,0.1); outline: none; }

        /* ─── BUTTONS ─── */
        .ps-btn-primary {
          background: #f17c13; color: #fff; border: none;
          padding: 10px 22px; border-radius: 8px;
          font-size: 0.875rem; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: background 0.15s;
        }
        .ps-btn-primary:hover { background: #d96a0a; }
        .ps-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
        .ps-btn-secondary {
          background: transparent; color: #6b7280;
          border: 1px solid #d1d5db; padding: 10px 22px;
          border-radius: 8px; font-size: 0.875rem; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .ps-btn-secondary:hover { background: #f9fafb; color: #374151; }
        .ps-btn-secondary:disabled { opacity: 0.65; cursor: not-allowed; }

        /* ─── ALERTS ─── */
        .ps-alert-err { background: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.875rem; }
        .ps-alert-ok { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.875rem; }

        /* ─── STRENGTH POPOVER ─── */
        .ps-strength-wrap { position: relative; }
        .ps-strength-popover {
          opacity: 0; visibility: hidden; pointer-events: none;
          position: absolute; bottom: 100%; left: 0;
          width: 100%; max-width: 380px;
          background: #ffffff; border: 1px solid #e5e7eb;
          box-shadow: 0 -8px 24px rgba(0,0,0,0.1);
          border-radius: 12px; padding: 16px; z-index: 200;
          margin-bottom: 8px; transition: all 0.2s ease;
          transform: translateY(-4px);
        }
        .ps-strength-wrap:hover .ps-strength-popover {
          opacity: 1; visibility: visible; pointer-events: auto;
          transform: translateY(0);
        }

        /* ─── PROFILE PHOTO ─── */
        .ps-photo-row {
          display: flex; align-items: center; gap: 20px;
          margin-bottom: 24px; padding-bottom: 22px;
          border-bottom: 1px solid #f1f5f9;
        }
        .ps-photo-circle {
          width: 88px; height: 88px; border-radius: 50%;
          background: linear-gradient(135deg, #f17c13, #e8650a);
          display: flex; align-items: center; justify-content: center;
          font-size: 2rem; font-weight: 800; color: white;
          flex-shrink: 0; box-shadow: 0 4px 12px rgba(241,124,19,0.25);
        }

        /* ─── TOGGLE ─── */
        .ps-toggle-track {
          position: absolute; inset: 0; border-radius: 34px;
          transition: background 0.3s;
        }
        .ps-toggle-knob {
          position: absolute; height: 20px; width: 20px; bottom: 3px;
          background: white; border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          transition: left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        /* ─── BUDGET GRID ─── */
        .ps-budget-grid {
          display: grid; grid-template-columns: 100px 1fr 1fr;
          gap: 12px; background: #f9fafb; padding: 14px;
          border-radius: 10px; border: 1px solid #e5e7eb;
        }

        @keyframes pspin { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

        @media (max-width: 1024px) {
          .ps-grid-2 { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .ps-grid-2 { grid-template-columns: 1fr; }
          .ps-span-2 { grid-column: span 1; }
          .ps-content { padding: 20px 16px; }
          .ps-budget-grid { grid-template-columns: 1fr; }
        }

        /* ─── MESSAGING WORKSPACE ─── */
        .msg-layout { display: grid; grid-template-columns: 320px 1fr; gap: 24px; min-height: 480px; }
        .msg-list-panel { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
        .msg-list-header { padding: 16px; border-bottom: 1px solid #e5e7eb; display: flex; gap: 8px; background: #fbf7f3; }
        .msg-subtab-btn { flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid #d1d5db; background: #ffffff; font-size: 0.8rem; font-weight: 700; cursor: pointer; color: #4b5563; transition: all 0.15s; }
        .msg-subtab-btn.active { background: #f17c13; color: #ffffff; border-color: #f17c13; }
        .msg-list-items { overflow-y: auto; flex: 1; display: flex; flex-direction: column; }
        .msg-list-item { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; cursor: pointer; text-align: left; transition: background 0.15s; position: relative; }
        .msg-list-item:hover { background: #fbf7f3; }
        .msg-list-item.selected { background: rgba(241,124,19,0.05); border-left: 3px solid #f17c13; }
        .msg-item-sender { font-weight: 700; font-size: 0.85rem; color: #111827; margin-bottom: 2px; }
        .msg-item-company { font-size: 0.75rem; color: #6b7280; font-weight: 500; }
        .msg-item-subject { font-weight: 600; font-size: 0.8rem; color: #374151; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .msg-item-snippet { font-size: 0.75rem; color: #9ca3af; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .msg-item-badge { background: #10b981; color: white; font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 10px; position: absolute; top: 14px; right: 16px; }
        .msg-item-time { font-size: 0.65rem; color: #9ca3af; margin-top: 6px; text-align: right; }
        
        .msg-detail-panel { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; text-align: left; }
        .msg-detail-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #9ca3af; font-size: 0.9rem; gap: 12px; }
        .msg-detail-header { border-bottom: 1px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 20px; }
        .msg-detail-subject { font-size: 1.2rem; font-weight: 800; color: #111827; margin: 0 0 8px 0; }
        .msg-detail-meta { font-size: 0.8rem; color: #4b5563; line-height: 1.5; }
        .msg-detail-body { font-size: 0.9rem; color: #374151; line-height: 1.6; white-space: pre-line; background: #fafafb; padding: 18px; border-radius: 8px; border: 1px solid #e5e7eb; }
        
        .msg-compose-card { background: #ffffff; border: 1px solid #eddcd2; border-radius: 16px; padding: 24px; text-align: left; }
      `}</style>

      <Header profileOverride={!isReadOnly ? { first_name: form.first_name, photo: currentPhoto } : undefined} />

      {/* ═══════════ MAIN AREA ═══════════ */}
      <div className="ps-main">

        {/* Content */}
        <div className="ps-content">
          <h1 className="ps-page-title">
            {isReadOnly ? `${form.first_name || "Partner"}'s Business Intent` : "Intent | Profile"}
          </h1>
          <p className="ps-page-sub">
            {isReadOnly ? `View business intention and parameters for ${form.first_name} ${form.last_name || ""}.` : "Manage your profile, intent, and preferences."}
          </p>

          {/* Tabs */}
          <div className="ps-tabs" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6", marginBottom: "20px", paddingBottom: "8px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className={`ps-tab ${activeTab === "intent" ? "ps-active" : ""}`} onClick={() => setActiveTab("intent")}>
                Intent
              </button>
              <button type="button" className={`ps-tab ${activeTab === "profile" ? "ps-active" : ""}`} onClick={() => setActiveTab("profile")}>
                Profile
              </button>
            </div>
            {isReadOnly ? (() => {
              const isStaff = (profile?.email && profile.email.endsWith("@linkmate.co.za"));
              const isConnected = isStaff || matches.some(m => m.partner.id === Number(id) && m.status === 'connected');
              
              if (isConnected) {
                return (
                  <button 
                    type="button" 
                    className="ps-btn-primary" 
                    style={{ padding: "8px 16px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "8px" }}
                    onClick={() => navigate("/messages", { state: { partnerId: id } })}
                  >
                    <MessageSquare size={14} />
                    Message Partner
                  </button>
                );
              } else {
                return (
                  <button 
                    type="button" 
                    className="ps-btn-secondary" 
                    style={{ 
                      padding: "8px 16px", 
                      fontSize: "0.85rem", 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: "6px", 
                      borderRadius: "8px", 
                      opacity: 0.6, 
                      cursor: "not-allowed",
                      border: "1px solid #d1d5db",
                      backgroundColor: "#f3f4f6",
                      color: "#9ca3af"
                    }}
                    disabled
                    title="You must mutually connect from the Matches tab before messaging."
                  >
                    <MessageSquare size={14} />
                    Message Locked
                  </button>
                );
              }
            })() : (
              <button 
                type="button" 
                className="ps-btn-secondary" 
                style={{
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "transparent",
                  color: "#4b5563",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
                onClick={() => navigate("/messages")}
              >
                <MessageSquare size={14} />
                Go to Messages
              </button>
            )}
          </div>

          {/* Alerts */}
          {error && <div className="ps-alert-err">⚠️ {error}</div>}
          {success && <div className="ps-alert-ok">✅ {success}</div>}

          <form onSubmit={handleUpdate}>
            <fieldset disabled={isReadOnly} style={{ border: "none", padding: 0, margin: 0, minWidth: 0 }}>

            {/* ════ INTENT TAB ════ */}
            {activeTab === "intent" && (
              <>
                <div className="ps-card">
                  <h2 className="ps-card-title">Matchmaker Intent</h2>
                  <p className="ps-card-sub">Manage your matchmaking intention statement and parameters.</p>
                  <hr className="ps-divider" />

                  <div className="ps-grid-2">

                    {/* Intent Textarea */}
                    <div className="ps-field ps-span-2">
                      <label className="ps-label">Matchmaking Intention</label>
                      <textarea
                        name="intent" rows={5}
                        className="ps-textarea"
                        placeholder="Describe what your business needs, targeting specific regions, services or partners..."
                        value={form.intent}
                        onChange={handleChange}
                        required
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                        <small style={{ color: "#9ca3af", fontSize: "0.75rem" }}>AI scans this statement live as you type.</small>
                        <small style={{ color: wordCount >= 300 ? "#10b981" : "#9ca3af", fontSize: "0.75rem", fontWeight: 600 }}>
                          {wordCount}/300 words
                        </small>
                      </div>
                    </div>

                    {/* Strength Indicator */}
                    <div className="ps-field ps-span-2 ps-strength-wrap">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <label className="ps-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                          Intention Strength
                          <span style={{ fontSize: "0.7rem", background: "#e5e7eb", color: "#6b7280", padding: "2px 7px", borderRadius: "10px", fontWeight: 600, cursor: "help" }}>
                            Hover for details
                          </span>
                        </label>
                        {analyzing ? (
                          <span style={{ fontSize: "0.8rem", color: "#f17c13", fontWeight: 700, animation: "pspin 1.5s infinite" }}>⚡ Evaluating...</span>
                        ) : aiScore !== null ? (
                          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: getMeterColor(aiScore), textTransform: "uppercase" }}>{aiClarity} ({aiScore}%)</span>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>No intention entered</span>
                        )}
                      </div>
                      <div style={{ height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${aiScore || 0}%`, background: getMeterColor(aiScore || 0), borderRadius: 4, transition: "width 0.4s ease" }} />
                      </div>

                      {/* Hover Popover */}
                      <div className="ps-strength-popover">
                        <h4 style={{ margin: "0 0 10px", fontSize: "0.85rem", fontWeight: 800, color: "#111827", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>Strength Breakdown</h4>
                        {aiMetrics ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                            {[
                              { label: "Ethical", key: "ethical" },
                              { label: "Professional", key: "professional" },
                              { label: "Mutually Beneficial", key: "mutual_benefit" },
                              { label: "Reasonable", key: "reasonableness" },
                              { label: "Aligned to Role & Budget", key: "alignment" },
                              { label: "Completeness", key: "completeness" }
                            ].map(item => {
                              const val = aiMetrics[item.key] || 0;
                              return (
                                <div key={item.key}>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", marginBottom: 2 }}>
                                    <span style={{ color: "#4b5563", fontWeight: 600 }}>{item.label}</span>
                                    <span style={{ color: "#111827", fontWeight: 700 }}>{val}%</span>
                                  </div>
                                  <div style={{ height: 3, background: "#e5e7eb", borderRadius: 2, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${val}%`, background: getMeterColor(val) }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0 0 10px" }}>Start typing to see a live breakdown.</p>
                        )}
                        {aiSuggestions.length > 0 && (
                          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 8 }}>
                            <span style={{ fontSize: "0.7rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Tips:</span>
                            <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                              {aiSuggestions.map((s, i) => (
                                <li key={i} style={{ fontSize: "0.75rem", color: "#4b5563", display: "flex", gap: 4, lineHeight: 1.4 }}>
                                  <span style={{ color: "#f17c13" }}>•</span><span>{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Toggle */}
                    <div className="ps-field ps-span-2" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 18px" }}>
                      <div>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#111827", display: "block" }}>
                          Intention Status: <span style={{ color: form.intent_active ? "#10b981" : "#6b7280" }}>{form.intent_active ? "Active" : "Inactive"}</span>
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          {form.intent_active ? "🟢 Matching in real-time." : "🔴 Paused — no new recommendations."}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: !form.intent_active ? "#f17c13" : "#9ca3af" }}>Inactive</span>
                        <label style={{ position: "relative", display: "inline-block", width: 50, height: 26, cursor: "pointer", margin: 0 }}>
                          <input type="checkbox" name="intent_active" checked={form.intent_active} onChange={handleChange} style={{ opacity: 0, width: 0, height: 0 }} />
                          <span className="ps-toggle-track" style={{ background: form.intent_active ? "#f17c13" : "#d1d5db" }}>
                            <span className="ps-toggle-knob" style={{ left: form.intent_active ? 27 : 3 }} />
                          </span>
                        </label>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: form.intent_active ? "#f17c13" : "#9ca3af" }}>Active</span>
                      </div>
                    </div>

                    <div className="ps-field ps-span-2" style={{ position: "relative" }}>
                      <label className="ps-label">Location <span style={{ color: "#f17c13" }}>*</span></label>
                      <input type="text" name="location" className="ps-input"
                        placeholder="e.g. Sandton, Centurion, Stellenbosch, or Zip Code..."
                        value={form.location}
                        onChange={e => handleLocationChange(e.target.value)}
                        onFocus={() => { if (form.location.trim()) { setLocationSuggestions(COMMON_LOCATIONS.filter(l => l.toLowerCase().includes(form.location.toLowerCase()))); setShowSuggestions(true); } }}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        required
                      />
                      {showSuggestions && locationSuggestions.length > 0 && locationDropdown(locationSuggestions)}
                    </div>

                    {/* Map */}
                    <div className="ps-span-2" style={{ marginBottom: "1rem" }}>
                      <div style={{ position: "relative", height: 220, borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", background: "#f3f4f6" }}>
                        <iframe title="Intent Location Map" width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(form.location || "South Africa")}&t=&z=13&ie=UTF8&iwloc=&output=embed`} />
                        <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(17,24,39,0.85)", color: "white", padding: "5px 12px", borderRadius: 14, fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                          📍 {form.location ? `Location: ${form.location}` : "Default: South Africa"}
                        </div>
                      </div>
                    </div>

                    {/* Decision Influence */}
                    <div className="ps-field">
                      <label className="ps-label">Decision Influence</label>
                      <select name="influence" className="ps-select" value={form.influence} onChange={handleChange}>
                        <option value="Sole Decision Maker">Sole Decision Maker</option>
                        <option value="Recommend / Influence">Recommend / Influence</option>
                        <option value="No Direct Influence">No Direct Influence</option>
                      </select>
                    </div>

                    {/* Active Lifespan */}
                    <div className="ps-field">
                      <label className="ps-label">Active Lifespan</label>
                      <select name="intent_lifespan" className="ps-select" value={form.intent_lifespan} onChange={handleChange}>
                        <option value="30 Days">30 Days</option>
                        <option value="90 Days">90 Days</option>
                        <option value="6 Months">6 Months</option>
                        <option value="Indefinite">Indefinite</option>
                      </select>
                      <small style={{ color: "#f17c13", fontWeight: 600, fontSize: "0.75rem" }}>⏰ Expiry: {calculateExpiryDate(form.intent_lifespan)}</small>
                    </div>

                    {/* Comm Channel */}
                    <div className="ps-field">
                      <label className="ps-label">Communication Channel</label>
                      <select name="comm_channel" className="ps-select" value={form.comm_channel} onChange={handleChange}>
                        <option value="Email">Email</option>
                        <option value="Phone">Phone</option>
                      </select>
                    </div>

                    {/* Available Hours */}
                    <div className="ps-field">
                      <label className="ps-label">Available Hours</label>
                      <select name="comm_hours" className="ps-select" value={form.comm_hours} onChange={handleChange}>
                        <option value="Work hours">Work hours</option>
                        <option value="After hours">After hours</option>
                      </select>
                    </div>

                    {/* Budget toggle */}
                    <div className="ps-field ps-span-2">
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.82rem", color: "#374151" }}>
                        <input type="checkbox" name="has_budget" checked={form.has_budget} onChange={handleChange} style={{ width: 16, height: 16, accentColor: "#f17c13" }} />
                        <span>Involves a specific budget</span>
                      </label>
                    </div>

                    {/* Budget Fields */}
                    {form.has_budget && (
                      <div className="ps-span-2 ps-budget-grid">
                        <div className="ps-field">
                          <label className="ps-label" style={{ fontSize: "0.75rem" }}>Currency</label>
                          <select name="budget_currency" className="ps-select" style={{ padding: "0.5rem", fontSize: "0.8rem", backgroundImage: "none" }} value={form.budget_currency} onChange={handleChange}>
                            <option value="ZAR">ZAR (R)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                          </select>
                        </div>
                        <div className="ps-field">
                          <label className="ps-label" style={{ fontSize: "0.75rem" }}>Min Budget</label>
                          <input type="number" name="budget_min" className="ps-input" style={{ padding: "0.5rem", fontSize: "0.8rem" }} placeholder="e.g. 50000" value={form.budget_min} onChange={handleChange} />
                        </div>
                        <div className="ps-field">
                          <label className="ps-label" style={{ fontSize: "0.75rem" }}>Max Budget</label>
                          <input type="number" name="budget_max" className="ps-input" style={{ padding: "0.5rem", fontSize: "0.8rem" }} placeholder="e.g. 500000" value={form.budget_max} onChange={handleChange} />
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </>
            )}

            {/* ════ PROFILE TAB ════ */}
            {activeTab === "profile" && (
              <>
                <div className="ps-card">
                  <h2 className="ps-card-title">Profile Information</h2>
                  <p className="ps-card-sub">Manage your personal information and how it appears on Small Circles.</p>
                  <hr className="ps-divider" />

                  {/* Photo Row */}
                  <div className="ps-photo-row">
                    {currentPhoto ? (
                      <img
                        src={currentPhoto}
                        alt="Profile Preview"
                        style={{
                          width: "88px",
                          height: "88px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          boxShadow: "0 4px 12px rgba(241,124,19,0.25)",
                          border: "2px solid #ffffff",
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div className="ps-photo-circle">{getInitials()}</div>
                    )}
                    <div>
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              setError("Image size cannot exceed 2MB.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setForm({ ...form, photo: reader.result });
                              setError("");
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="ps-btn-secondary"
                        style={{ fontSize: "0.8rem", padding: "7px 14px" }}
                        onClick={() => document.getElementById("avatar-upload").click()}
                      >
                        Change Photo
                      </button>
                      {currentPhoto && (
                        <button
                          type="button"
                          className="ps-btn-secondary"
                          style={{ fontSize: "0.8rem", padding: "7px 14px", marginLeft: "8px", borderColor: "#ef4444", color: "#ef4444" }}
                          onClick={() => setForm({ ...form, photo: "" })}
                        >
                          Remove Photo
                        </button>
                      )}
                      <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "6px 0 0" }}>JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                  </div>

                  <div className="ps-grid-2">
                    <div className="ps-field">
                      <label className="ps-label">First Name</label>
                      <input type="text" name="first_name" className="ps-input" value={form.first_name} onChange={handleChange} required />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Last Name</label>
                      <input type="text" name="last_name" className="ps-input" value={form.last_name} onChange={handleChange} required />
                    </div>
                    {!isReadOnly && (
                      <>
                        <div className="ps-field">
                          <label className="ps-label">Email Address</label>
                          <input type="email" className="ps-input" value={profile?.email || ""} disabled />
                        </div>
                        <div className="ps-field">
                          <label className="ps-label">Phone Number</label>
                          <input type="text" name="phone" className="ps-input" placeholder="+27 82 123 4567" value={form.phone} onChange={handleChange} />
                        </div>
                      </>
                    )}
                    <div className="ps-field">
                      <label className="ps-label">Job Title</label>
                      <input type="text" name="role" className="ps-input" placeholder="Data Analytics Manager" value={form.role} onChange={handleChange} />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">Company</label>
                      <input type="text" name="company_name" className="ps-input" placeholder="Small Circles" value={form.company_name} onChange={handleChange} />
                    </div>
                    <div className="ps-field ps-span-2" style={{ position: "relative" }}>
                      <label className="ps-label">Location <span style={{ color: "#f17c13" }}>*</span></label>
                      <input type="text" name="location" className="ps-input"
                        placeholder="e.g. Sandton, Centurion, Stellenbosch..."
                        value={form.location}
                        onChange={e => handleLocationChange(e.target.value)}
                        onFocus={() => { if (form.location.trim()) { setLocationSuggestions(COMMON_LOCATIONS.filter(l => l.toLowerCase().includes(form.location.toLowerCase()))); setShowSuggestions(true); } }}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      />
                      {showSuggestions && locationSuggestions.length > 0 && locationDropdown(locationSuggestions)}
                    </div>

                    {/* Map */}
                    <div className="ps-span-2">
                      <div style={{ position: "relative", height: 220, borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", background: "#f3f4f6" }}>
                        <iframe title="Profile Location Map" width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(form.location || "South Africa")}&t=&z=13&ie=UTF8&iwloc=&output=embed`} />
                        <div style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(17,24,39,0.85)", color: "white", padding: "5px 12px", borderRadius: 14, fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                          📍 {form.location ? `Location: ${form.location}` : "Default: South Africa"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            {!isReadOnly && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 4 }}>
                <button type="button" className="ps-btn-secondary" disabled={saving}
                  onClick={() => {
                    if (!profile) return;
                    setForm({
                      first_name: profile.first_name, last_name: profile.last_name,
                      phone: profile.phone || "", company_name: profile.company_name || "",
                      intent: profile.intent || "", role: profile.role || "",
                      influence: profile.influence || "Recommend / Influence",
                      has_budget: profile.has_budget || false,
                      budget_min: profile.budget_min || "", budget_max: profile.budget_max || "",
                      budget_currency: profile.budget_currency || "ZAR",
                      comm_channel: profile.comm_channel || "Email",
                      comm_hours: profile.comm_hours || "Work hours",
                      intent_lifespan: profile.intent_lifespan || "90 Days",
                      location: profile.location || "",
                      intent_active: profile.intent_active !== false,
                      photo: profile.photo || ""
                    });
                    setSuccess(""); setError("");
                  }}
                >Cancel</button>
                <button type="submit" className="ps-btn-primary" disabled={saving}>
                  {saving ? "💾 Saving..." : "Save Changes"}
                </button>
              </div>
            )}

            </fieldset>
          </form>
        </div>

        <Footer />

      </div>
    </div>
  );
}
