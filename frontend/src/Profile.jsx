import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfile, updateUserProfile, logout } from "./api";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    company_name: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserProfile()
      .then((data) => {
        setProfile(data);
        setForm({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone || "",
          company_name: data.company_name || ""
        });
      })
      .catch((err) => {
        setError("Failed to load profile. Please login again.");
        logout();
        setTimeout(() => navigate("/login"), 2000);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const updated = await updateUserProfile(form);
      setProfile(updated);
      setSuccess("Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      setError("Failed to update profile.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: "100px" }}>Loading profile...</p>;
  }

  return (
    <section style={{ backgroundColor: "#f4f4f4", padding: "100px 0", minHeight: "100vh" }}>
      <div className="container">
        <div style={{
          background: "#fff",
          borderRadius: "24px",
          padding: "35px",
          boxShadow: "0 15px 40px rgba(0,0,0,0.15)",
          maxWidth: "700px",
          margin: "0 auto"
        }}>
          <h2 style={{ marginBottom: "20px", color: "#f17c13" }}>Your Profile</h2>

          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}

          {!editing ? (
            <div>
              <p><strong>First Name:</strong> {profile?.first_name}</p>
              <p><strong>Last Name:</strong> {profile?.last_name}</p>
              <p><strong>Email Address:</strong> {profile?.email}</p>
              <p><strong>Phone:</strong> {profile?.phone || "Not provided"}</p>
              <p><strong>Company Name:</strong> {profile?.company_name || "Not provided"}</p>
              <p><strong>Login Provider:</strong> {profile?.auth_provider}</p>

              <div style={{ display: "flex", gap: "10px", marginTop: "30px" }}>
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    backgroundColor: "#f17c13",
                    color: "#fff",
                    border: "none",
                    padding: "10px 25px",
                    borderRadius: "20px",
                    cursor: "pointer"
                  }}
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    backgroundColor: "#555",
                    color: "#fff",
                    border: "none",
                    padding: "10px 25px",
                    borderRadius: "20px",
                    cursor: "pointer"
                  }}
                >
                  Logout
                </button>
                <button
                  onClick={() => navigate("/search")}
                  style={{
                    backgroundColor: "#00ad5f",
                    color: "#fff",
                    border: "none",
                    padding: "10px 25px",
                    borderRadius: "20px",
                    cursor: "pointer"
                  }}
                >
                  Go to Search
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">First Name</label>
                  <input
                    name="first_name"
                    className="form-control"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Last Name</label>
                  <input
                    name="last_name"
                    className="form-control"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Phone Number</label>
                  <input
                    name="phone"
                    className="form-control"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Company Name</label>
                  <input
                    name="company_name"
                    className="form-control"
                    value={form.company_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-12" style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: "#f17c13",
                      color: "#fff",
                      border: "none",
                      padding: "10px 25px",
                      borderRadius: "20px",
                      cursor: "pointer"
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    style={{
                      backgroundColor: "#555",
                      color: "#fff",
                      border: "none",
                      padding: "10px 25px",
                      borderRadius: "20px",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
