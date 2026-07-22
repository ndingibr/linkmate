import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { getUserIntents, createUserIntent, updateUserIntent, deleteUserIntent, analyzeIntent, getUserProfile } from "./api";
import { Plus, Edit2, Trash2, Power, AlertCircle, CheckCircle, Target, ArrowLeft } from "lucide-react";
import intentionsImg from "./img/exec_strategy_focus.jpg";

export default function Intentions() {
  const navigate = useNavigate();

  const [intents, setIntents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successInfo, setSuccessInfo] = useState("");

  // View state: "list" or "form" (No Popup!)
  const [viewState, setViewState] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    type: "buy",
    intention: "",
    influence: "Recommend / Influence",
    has_budget: false,
    budget_min: "",
    budget_max: "",
    budget_currency: "ZAR",
    intent_lifespan: "90 Days",
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  // Real-time Evaluation
  const [aiScore, setAiScore] = useState(null);
  const [aiClarity, setAiClarity] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadIntents();
  }, []);

  const loadIntents = async () => {
    setLoading(true);
    setError("");

    let cached = [];
    try {
      const cachedStr = localStorage.getItem("local_user_intents");
      if (cachedStr) cached = JSON.parse(cachedStr);
    } catch (e) {
      cached = [];
    }

    try {
      let data = await getUserIntents();
      let serverIntents = Array.isArray(data) ? data : [];
      
      if (serverIntents.length === 0) {
        try {
          const profile = await getUserProfile();
          if (profile && Array.isArray(profile.intents) && profile.intents.length > 0) {
            serverIntents = profile.intents;
          }
        } catch (e) {}
      }

      const merged = [...serverIntents];
      if (Array.isArray(cached)) {
        cached.forEach((cItem) => {
          if (
            cItem &&
            cItem.intention &&
            !merged.some((m) => m.id === cItem.id || m.intention === cItem.intention)
          ) {
            merged.push(cItem);
          }
        });
      }

      setIntents(merged);
      localStorage.setItem("local_user_intents", JSON.stringify(merged));
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/signin");
      } else {
        setIntents(Array.isArray(cached) ? cached : []);
        setError("");
      }
    } finally {
      setLoading(false);
    }
  };

  // Evaluation Effect for Intention Statement
  useEffect(() => {
    if (!form.intention || !form.intention.trim()) {
      setAiScore(null);
      setAiClarity("");
      return;
    }
    const t = setTimeout(async () => {
      setAnalyzing(true);
      try {
        const res = await analyzeIntent(form.intention);
        setAiScore(res.score);
        setAiClarity(res.clarity_level);
      } catch (e) {
        console.warn("Analysis error:", e);
      } finally {
        setAnalyzing(false);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [form.intention]);

  const handleOpenAddForm = () => {
    setEditingId(null);
    setForm({
      title: "",
      type: "buy",
      intention: "",
      influence: "Recommend / Influence",
      has_budget: false,
      budget_min: "",
      budget_max: "",
      budget_currency: "ZAR",
      intent_lifespan: "90 Days",
      is_active: true
    });
    setAiScore(null);
    setViewState("form");
  };

  const handleOpenEditForm = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || "",
      type: item.type || "buy",
      intention: item.intention || "",
      influence: item.influence || "Recommend / Influence",
      has_budget: !!item.has_budget,
      budget_min: item.budget_min ? String(item.budget_min) : "",
      budget_max: item.budget_max ? String(item.budget_max) : "",
      budget_currency: item.budget_currency || "ZAR",
      intent_lifespan: item.intent_lifespan || "90 Days",
      is_active: item.is_active ?? true
    });
    setAiScore(null);
    setViewState("form");
  };

  const handleToggleActive = async (item, e) => {
    e.stopPropagation();
    try {
      await updateUserIntent(item.id, { is_active: !item.is_active });
      loadIntents();
    } catch (err) {
      setError("Failed to update status.");
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this intention?")) return;
    try {
      await deleteUserIntent(id);
      setSuccessInfo("Intention deleted.");
      setTimeout(() => setSuccessInfo(""), 3000);
      loadIntents();
    } catch (err) {
      setError("Failed to delete intention.");
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      title: form.title || `${(form.type || "BUY").toUpperCase()} Intention`,
      type: form.type || "buy",
      intention: form.intention,
      influence: form.influence,
      has_budget: form.has_budget,
      budget_min: form.has_budget && form.budget_min ? parseFloat(form.budget_min) : null,
      budget_max: form.has_budget && form.budget_max ? parseFloat(form.budget_max) : null,
      budget_currency: form.budget_currency,
      intent_lifespan: form.intent_lifespan,
      is_active: form.is_active
    };

    try {
      let savedItem;
      if (editingId) {
        try {
          savedItem = await updateUserIntent(editingId, payload);
        } catch (e) {
          savedItem = { id: editingId, ...payload };
        }
        setIntents((prev) => {
          const next = prev.map((item) => (item.id === editingId ? { ...item, ...savedItem } : item));
          localStorage.setItem("local_user_intents", JSON.stringify(next));
          return next;
        });
        setSuccessInfo("Intention updated successfully.");
      } else {
        try {
          savedItem = await createUserIntent(payload);
        } catch (e) {
          savedItem = { id: Date.now(), ...payload, created_at: new Date().toISOString() };
        }
        const newItem = savedItem && savedItem.id ? savedItem : { id: Date.now(), ...payload };
        setIntents((prev) => {
          const next = [newItem, ...prev.filter((i) => i.id !== newItem.id)];
          localStorage.setItem("local_user_intents", JSON.stringify(next));
          return next;
        });
        setSuccessInfo("New business intention created.");
      }
      setViewState("list");
      setTimeout(() => setSuccessInfo(""), 3000);
      loadIntents();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save intention.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="split-page-wrapper" style={{ backgroundColor: "#eef1f6", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main style={{ flex: 1, padding: "40px 24px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* ════ HERO HEADER BANNER (EXECUTIVE SWATCH COLOR #eef1f6 WITH 104px PICTURE) ════ */}
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
                <img src={intentionsImg} alt="Intentions" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>

              {/* Header Content */}
              <div style={{ flex: 1, minWidth: "240px" }}>
                <div style={{ color: "#ec5e3b", fontWeight: "800", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                  Targeting & Matchmaking
                </div>

                <h1 style={{ fontSize: "2.1rem", fontWeight: "800", color: "#35453f", margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
                  Intentions
                </h1>

                <p style={{ color: "#4b5563", fontSize: "0.95rem", margin: 0, fontWeight: "500", lineHeight: "1.5", maxWidth: "820px" }}>
                  Manage your active business requirements and service offerings to trigger high-probability introductions.
                </p>
              </div>

            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "12px 16px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}
          {successInfo && (
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", color: "#166534", padding: "12px 16px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={18} /> {successInfo}
            </div>
          )}

          {/* ════ VIEW 1: INTENTION LIST VIEW (IN WHITE CARD PANE WITH CREATE BUTTON INSIDE) ════ */}
          {viewState === "list" && (
            <div className="form-card-premium" style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "2.5rem 2.2rem", border: "1px solid #e5e7eb", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
              
              {/* Header Row inside White Pane with + Add New Intention Button */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "16px", paddingBottom: "16px", borderBottom: "1px solid #f3f4f6" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#35453f", margin: 0 }}>
                  Registered Intentions ({intents.length})
                </h2>

                <button
                  onClick={handleOpenAddForm}
                  style={{
                    backgroundColor: "#ec5e3b",
                    color: "#ffffff",
                    border: "none",
                    padding: "12px 28px",
                    borderRadius: "30px",
                    fontWeight: "700",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(236, 94, 59, 0.35)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "auto",
                    minWidth: "180px"
                  }}
                >
                  <Plus size={18} /> Add New Intention
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}>
                  Loading your business intentions...
                </div>
              ) : intents.length === 0 ? (
                <div style={{ padding: "60px 20px", textAlign: "center", border: "1px dashed #d1d5db", borderRadius: "20px", background: "#f8fafc" }}>
                  <Target size={48} color="#ec5e3b" style={{ margin: "0 auto 12px", opacity: 0.85 }} />
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#35453f", margin: "0 0 6px" }}>No Business Intentions Registered</h3>
                  <p style={{ color: "#6b7280", fontSize: "0.9rem", maxWidth: "460px", margin: "0 auto", lineHeight: "1.5" }}>
                    Add your explicit business requirements or service offerings to start receiving direct corporate introductions.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {intents.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleOpenEditForm(item)}
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "18px",
                        padding: "1.5rem 1.8rem",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.03)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        opacity: item.is_active ? 1 : 0.75
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = "#ec5e3b"}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{
                            padding: "6px 14px",
                            borderRadius: "20px",
                            fontWeight: "700",
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            backgroundColor: item.type === "buy" ? "#fff7ed" : "#f0fdf4",
                            color: item.type === "buy" ? "#c2410c" : "#166534",
                            border: item.type === "buy" ? "1px solid #ffedd5" : "1px solid #86efac"
                          }}>
                            {item.type === "buy" ? "Seeking Supplier" : "Offering Solution"}
                          </span>
                          <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: "500" }}>
                            Lifespan: {item.intent_lifespan || "90 Days"}
                          </span>
                        </div>

                        {/* Controls */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <button
                            onClick={(e) => handleToggleActive(item, e)}
                            style={{
                              background: "none",
                              border: "1px solid #d1d5db",
                              padding: "4px 10px",
                              borderRadius: "14px",
                              fontSize: "0.78rem",
                              fontWeight: "600",
                              cursor: "pointer",
                              color: item.is_active ? "#166534" : "#6b7280",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Power size={13} /> {item.is_active ? "Active" : "Paused"}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenEditForm(item); }}
                            style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", padding: "4px" }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            style={{ background: "none", border: "none", color: "#b91c1c", cursor: "pointer", padding: "4px" }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <p style={{ fontSize: "1rem", color: "#1f2937", lineHeight: "1.6", margin: "0 0 12px", fontWeight: "500" }}>
                        "{item.intention}"
                      </p>

                      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "0.82rem", color: "#4b5563" }}>
                        <span><strong>Influence:</strong> {item.influence || "Direct"}</span>
                        {item.has_budget && item.budget_min && (
                          <span>
                            <strong>Budget:</strong> {item.budget_currency || "ZAR"} {Number(item.budget_min).toLocaleString()} {item.budget_max ? `- ${Number(item.budget_max).toLocaleString()}` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        {/* ════ VIEW 2: ADD / EDIT INTENTION FORM (SINGLE-PANE IN WHITE CARD WITH BACK BUTTON) ════ */}
        {viewState === "form" && (
          <div className="form-card-premium" style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "2.5rem 2.2rem", border: "1px solid #e5e7eb", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)", width: "100%", maxWidth: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Back to Intentions Button Inside White Pane */}
            <div>
              <button
                type="button"
                onClick={() => setViewState("list")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#ffffff",
                  color: "#35453f",
                  border: "1px solid #d1d5db",
                  padding: "8px 18px",
                  borderRadius: "20px",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                <ArrowLeft size={16} /> Back to Intentions
              </button>
            </div>

            <h2 style={{ fontSize: "1.4rem", fontWeight: "700", color: "#35453f", margin: 0 }}>
              {editingId ? "Edit Business Intention" : "Add New Business Intention"}
            </h2>

            <form onSubmit={handleSubmitForm} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>

              {/* Intention Statement */}
              <div className="input-group-premium">
                <label className="input-label-premium">Intention Statement *</label>
                <textarea
                  rows={4}
                  className="input-premium"
                  placeholder="Describe specifically what your business needs or offers..."
                  value={form.intention}
                  onChange={(e) => setForm({ ...form, intention: e.target.value })}
                  required
                />
              </div>

              {/* Synergy Strength Indicator */}
              {form.intention && (
                <div style={{ background: "#f9fafb", padding: "12px 16px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#4b5563", marginBottom: "6px" }}>
                    <span>Synergy Strength Score</span>
                    <span style={{ color: aiScore >= 75 ? "#10b981" : "#ec5e3b" }}>{analyzing ? "Evaluating..." : `${aiClarity} (${aiScore || 0}%)`}</span>
                  </div>
                  <div style={{ height: "6px", background: "#e5e7eb", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${aiScore || 0}%`, background: aiScore >= 75 ? "#10b981" : "#ec5e3b", transition: "width 0.4s ease" }} />
                  </div>
                </div>
              )}

              {/* Influence & Lifespan */}
              <div className="form-row-premium" style={{ display: "flex", gap: "16px" }}>
                <div className="input-group-premium" style={{ flex: 1 }}>
                  <label className="input-label-premium">Decision Influence</label>
                  <select className="input-premium" value={form.influence} onChange={(e) => setForm({ ...form, influence: e.target.value })}>
                    <option value="Sole Decision Maker">Sole Decision Maker</option>
                    <option value="Recommend / Influence">Recommend / Influence</option>
                    <option value="No Direct Influence">No Direct Influence</option>
                  </select>
                </div>
                <div className="input-group-premium" style={{ flex: 1 }}>
                  <label className="input-label-premium">Lifespan</label>
                  <select className="input-premium" value={form.intent_lifespan} onChange={(e) => setForm({ ...form, intent_lifespan: e.target.value })}>
                    <option value="30 Days">30 Days</option>
                    <option value="90 Days">90 Days</option>
                    <option value="180 Days">180 Days</option>
                    <option value="Ongoing">Ongoing</option>
                  </select>
                </div>
              </div>

              {/* Budget Section */}
              <div style={{ background: "#f8fafc", padding: "18px 20px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: form.has_budget ? "14px" : 0 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "#35453f" }}>Target Budget / Deal Value Range</h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#6b7280" }}>Specify deal size or budget range to refine partner matching.</p>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.88rem", fontWeight: "600", color: "#35453f" }}>
                    <input
                      type="checkbox"
                      checked={form.has_budget}
                      onChange={(e) => setForm({ ...form, has_budget: e.target.checked })}
                      style={{ width: "18px", height: "18px", accentColor: "#ec5e3b", cursor: "pointer" }}
                    />
                    Enable Budget Range
                  </label>
                </div>

                {form.has_budget && (
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", paddingTop: "8px" }}>
                    <div className="input-group-premium" style={{ flex: "0 0 130px" }}>
                      <label className="input-label-premium">Currency</label>
                      <select
                        className="input-premium"
                        value={form.budget_currency}
                        onChange={(e) => setForm({ ...form, budget_currency: e.target.value })}
                      >
                        <option value="ZAR">ZAR (R)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    <div className="input-group-premium" style={{ flex: 1 }}>
                      <label className="input-label-premium">Min Deal Value</label>
                      <input
                        type="number"
                        className="input-premium"
                        placeholder="e.g. 50000"
                        value={form.budget_min}
                        onChange={(e) => setForm({ ...form, budget_min: e.target.value })}
                      />
                    </div>

                    <div className="input-group-premium" style={{ flex: 1 }}>
                      <label className="input-label-premium">Max Deal Value</label>
                      <input
                        type="number"
                        className="input-premium"
                        placeholder="e.g. 250000"
                        value={form.budget_max}
                        onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Active Status Checkbox */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 0" }}>
                <input
                  type="checkbox"
                  id="is_active_check"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  style={{ width: "18px", height: "18px", accentColor: "#ec5e3b", cursor: "pointer" }}
                />
                <label htmlFor="is_active_check" style={{ fontSize: "0.9rem", fontWeight: "600", color: "#35453f", cursor: "pointer" }}>
                  Active Intention (Enable automated partner matching)
                </label>
              </div>

              {/* FAR RIGHT SAVE BUTTON */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setViewState("list")}
                  style={{ backgroundColor: "transparent", color: "#6b7280", border: "1px solid #d1d5db", padding: "14px 28px", borderRadius: "30px", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: "#ec5e3b", color: "#ffffff", border: "none", padding: "14px 44px", borderRadius: "30px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer", boxShadow: "0 4px 14px rgba(236, 94, 59, 0.35)", minWidth: "180px" }}
                >
                  {submitting ? "Saving..." : "Save Intention"}
                </button>
              </div>

            </form>
          </div>
        )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
