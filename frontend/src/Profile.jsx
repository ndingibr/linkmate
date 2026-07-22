import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserProfile, updateUserProfile, getOtherUserProfile } from "./api";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { User, Building, MapPin, Phone, Mail, Clock, Camera, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isReadOnly = !!id;

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company_name: "",
    role: "",
    location: "",
    comm_channel: "Email",
    comm_hours: "Work hours",
    photo: ""
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    "Soweto, Johannesburg", "Johannesburg, Gauteng", "Cape Town, Western Cape",
    "Durban, KwaZulu-Natal", "Pretoria, Gauteng", "South Africa"
  ];

  useEffect(() => {
    loadProfileData();
  }, [id]);

  const loadProfileData = async () => {
    setLoading(true);
    setError("");
    try {
      if (isReadOnly) {
        const data = await getOtherUserProfile(id);
        setProfile(data);
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          company_name: data.company_name || "",
          role: data.role || "",
          location: data.location || "",
          comm_channel: data.comm_channel || "Email",
          comm_hours: data.comm_hours || "Work hours",
          photo: data.photo || ""
        });
      } else {
        const data = await getUserProfile();
        setProfile(data);
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          company_name: data.company_name || "",
          role: data.role || "",
          location: data.location || "",
          comm_channel: data.comm_channel || "Email",
          comm_hours: data.comm_hours || "Work hours",
          photo: data.photo || ""
        });
      }
    } catch (err) {
      if (err.response?.status === 401 && !isReadOnly) {
        navigate("/signin");
      } else {
        setError("Failed to load profile details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
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

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Photo size must be under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newPhoto = reader.result;
        setForm(f => ({ ...f, photo: newPhoto }));
        try {
          await updateUserProfile({ photo: newPhoto });
          setSuccess("Profile photo updated & saved!");
          setTimeout(() => setSuccess(""), 3500);
        } catch (err) {
          console.error("Auto-save photo failed:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await updateUserProfile(form);
      setSuccess("Profile settings updated successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="split-page-wrapper" style={{ backgroundColor: "#eef1f6", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main style={{ flex: 1, padding: "40px 24px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          
          {/* Alerts */}
          {error && (
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}
          {success && (
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", color: "#166534", padding: "12px 16px", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle size={18} /> {success}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#6b7280" }}>
              Loading profile details...
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
              
              {/* ════ HERO BANNER CARD (EXECUTIVE SWATCH COLOR BACKGROUND #eef1f6) ════ */}
              <div style={{
                backgroundColor: "#eef1f6",
                borderRadius: "24px",
                padding: "2.5rem 2.2rem",
                color: "#1f2937",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
                border: "1px solid #d1d5db",
                width: "100%",
                boxSizing: "border-box"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
                  
                  {/* Avatar Frame */}
                  <div style={{ position: "relative" }}>
                    <div style={{
                      width: "104px", height: "104px", borderRadius: "50%",
                      backgroundColor: "#ffffff", overflow: "hidden", display: "flex",
                      alignItems: "center", justifyContent: "center", border: "3.5px solid #d1d5db",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.08)"
                    }}>
                      {form.photo ? (
                        <img src={form.photo} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "2.5rem", fontWeight: "800", color: "#ec5e3b" }}>
                          {(form.first_name[0] || "U").toUpperCase()}
                        </span>
                      )}
                    </div>
                    {!isReadOnly && (
                      <label style={{
                        position: "absolute", bottom: 2, right: 2,
                        backgroundColor: "#ec5e3b", color: "#ffffff",
                        width: "32px", height: "32px", borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                        border: "2px solid #ffffff"
                      }}>
                        <Camera size={15} />
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
                      </label>
                    )}
                  </div>

                  {/* Header Content */}
                  <div style={{ flex: 1, minWidth: "240px" }}>
                    {/* Orange Category Badge */}
                    <div style={{ color: "#ec5e3b", fontWeight: "800", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                      Executive Account
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <h1 style={{ fontSize: "2.1rem", fontWeight: "800", color: "#35453f", margin: 0, letterSpacing: "-0.02em" }}>
                        {form.first_name} {form.last_name}
                      </h1>
                      {profile?.company_verified && (
                        <span style={{ backgroundColor: "#065f46", color: "#ffffff", border: "1px solid #047857", fontSize: "0.75rem", fontWeight: "700", padding: "4px 12px", borderRadius: "14px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <ShieldCheck size={14} /> Corporate Verified
                        </span>
                      )}
                    </div>

                    <p style={{ color: "#4b5563", fontSize: "0.95rem", margin: "0 0 14px 0", fontWeight: "600" }}>
                      {form.role || "Executive Member"} {form.company_name ? `• ${form.company_name}` : ""}
                    </p>

                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "0.85rem", color: "#4b5563", fontWeight: "500" }}>
                      {form.location && (
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <MapPin size={15} color="#ec5e3b" /> {form.location}
                        </span>
                      )}
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Mail size={15} color="#ec5e3b" /> {form.email}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* ════ MAIN EDIT FORM CARD (SPREADS FLUSH TO MATCH HERO BANNER WIDTH) ════ */}
              <div className="form-card-premium" style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "2.5rem", border: "1px solid #e5e7eb", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)", width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
                
                <form onSubmit={handleSubmitProfile} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  {/* SECTION 1: PERSONAL DETAILS */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <User size={18} color="#ec5e3b" />
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#35453f", margin: 0 }}>Personal Information</h3>
                    </div>

                    <div className="form-row-premium" style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                      <div className="input-group-premium" style={{ flex: 1 }}>
                        <label className="input-label-premium">First Name *</label>
                        <input type="text" name="first_name" className="input-premium" value={form.first_name} onChange={handleChange} disabled={isReadOnly} required />
                      </div>
                      <div className="input-group-premium" style={{ flex: 1 }}>
                        <label className="input-label-premium">Surname *</label>
                        <input type="text" name="last_name" className="input-premium" value={form.last_name} onChange={handleChange} disabled={isReadOnly} required />
                      </div>
                    </div>

                    <div className="form-row-premium" style={{ display: "flex", gap: "16px" }}>
                      <div className="input-group-premium" style={{ flex: 1 }}>
                        <label className="input-label-premium">Work Email</label>
                        <input type="email" name="email" className="input-premium" value={form.email} disabled style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed" }} />
                      </div>
                      <div className="input-group-premium" style={{ flex: 1 }}>
                        <label className="input-label-premium">Phone Number</label>
                        <input type="text" name="phone" className="input-premium" value={form.phone} onChange={handleChange} disabled={isReadOnly} placeholder="+27 82 123 4567" />
                      </div>
                    </div>
                  </div>

                  <hr style={{ border: 0, borderTop: "1px solid #f3f4f6", margin: 0 }} />

                  {/* SECTION 2: COMPANY & ROLE */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <Building size={18} color="#ec5e3b" />
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#35453f", margin: 0 }}>Company Representation</h3>
                    </div>

                    <div className="form-row-premium" style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                      <div className="input-group-premium" style={{ flex: 1 }}>
                        <label className="input-label-premium">Company Name</label>
                        <input type="text" name="company_name" className="input-premium" value={form.company_name} onChange={handleChange} disabled={isReadOnly} placeholder="Acme Corporation" />
                      </div>
                      <div className="input-group-premium" style={{ flex: 1 }}>
                        <label className="input-label-premium">Job Title / Role</label>
                        <input type="text" name="role" className="input-premium" value={form.role} onChange={handleChange} disabled={isReadOnly} placeholder="Procurement Director" />
                      </div>
                    </div>

                    {/* Location Autocomplete */}
                    <div className="input-group-premium" style={{ position: "relative" }}>
                      <label className="input-label-premium">Company Location (South Africa)</label>
                      <input
                        type="text"
                        className="input-premium"
                        placeholder="e.g. Sandton, Centurion, Stellenbosch..."
                        value={form.location}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        disabled={isReadOnly}
                      />
                      {showSuggestions && locationSuggestions.length > 0 && !isReadOnly && (
                        <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#ffffff", border: "1px solid #d1d5db", borderRadius: "8px", margin: "4px 0 0", padding: "4px 0", listStyle: "none", zIndex: 100, maxHeight: "160px", overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                          {locationSuggestions.map((loc, idx) => (
                            <li key={idx} style={{ padding: "8px 14px", fontSize: "0.85rem", cursor: "pointer", color: "#374151" }} onMouseDown={() => { setForm({ ...form, location: loc }); setShowSuggestions(false); }}>
                              📍 {loc}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <hr style={{ border: 0, borderTop: "1px solid #f3f4f6", margin: 0 }} />

                  {/* SECTION 3: COMMUNICATION PREFERENCES */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <Clock size={18} color="#ec5e3b" />
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#35453f", margin: 0 }}>Communication Preferences</h3>
                    </div>

                    <div className="form-row-premium" style={{ display: "flex", gap: "16px" }}>
                      <div className="input-group-premium" style={{ flex: 1 }}>
                        <label className="input-label-premium">Preferred Channel</label>
                        <select name="comm_channel" className="input-premium" value={form.comm_channel} onChange={handleChange} disabled={isReadOnly}>
                          <option value="Email">Email Notifications</option>
                          <option value="In-App Messaging">In-App Messaging</option>
                          <option value="Phone / WhatsApp">Phone / WhatsApp</option>
                        </select>
                      </div>
                      <div className="input-group-premium" style={{ flex: 1 }}>
                        <label className="input-label-premium">Available Hours</label>
                        <select name="comm_hours" className="input-premium" value={form.comm_hours} onChange={handleChange} disabled={isReadOnly}>
                          <option value="Work hours">Work hours (8 AM - 5 PM)</option>
                          <option value="Mornings">Mornings only</option>
                          <option value="Afternoons">Afternoons only</option>
                          <option value="Anytime">Anytime</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* FAR RIGHT COMPACT SAVE BUTTON */}
                  {!isReadOnly && (
                    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "12px", width: "100%" }}>
                      <button
                        type="submit"
                        disabled={saving}
                        style={{
                          backgroundColor: "#ec5e3b",
                          color: "#ffffff",
                          border: "none",
                          padding: "14px 48px",
                          borderRadius: "30px",
                          fontWeight: "700",
                          fontSize: "1rem",
                          cursor: "pointer",
                          boxShadow: "0 4px 14px rgba(236, 94, 59, 0.35)",
                          width: "auto",
                          minWidth: "180px"
                        }}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  )}

                </form>

              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
