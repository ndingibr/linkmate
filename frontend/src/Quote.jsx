import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { submitQuote } from "./api";
import { CartContext } from "./CartContext";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export default function Quote() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems, clearCart, removeFromCart } = useContext(CartContext);

  const item = location.state?.item;
  const logIdFromState = location.state?.log_id;

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    deliveryAddress: ""
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [itemsToShow, setItemsToShow] = useState(item ? [item] : cartItems);

  useEffect(() => {
    if (logIdFromState) {
      sessionStorage.setItem("log_id", logIdFromState);
    }
    setItemsToShow(item ? [item] : cartItems);
  }, [logIdFromState, item, cartItems]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validatePhone = (number) => {
    if (!number) return true;
    const phoneNumber = parsePhoneNumberFromString(number);
    return phoneNumber ? phoneNumber.isValid() : false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePhone(form.phone)) {
      setErrorMessage("Invalid phone number.");
      return;
    }

    const log_id = logIdFromState || sessionStorage.getItem("log_id");

    const payloadItems = itemsToShow.map((i) => ({
      name: i.name,
      attributes: i.attributes,
      quantity: i.quantity || 1,
      log_id
    }));

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      deliveryAddress: form.deliveryAddress,
      client_info: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        url: window.location.href
      },
      items: payloadItems
    };

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await submitQuote(payload);

      setSuccessMessage(
        `Quote submitted successfully! Quote ID: ${response.quote_id || "N/A"}`
      );

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        deliveryAddress: ""
      });

      clearCart();
      setItemsToShow([]);

      setTimeout(() => {
        navigate("/search");
      }, 2000); // delay so user sees success message
    } catch (error) {
      console.error("Quote submission error:", error);
      setErrorMessage("Failed to submit quote. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (name, log_id) => {
    setItemsToShow((prev) =>
      prev.filter((i) => !(i.name === name && i.log_id === log_id))
    );
    removeFromCart(name, log_id);
  };

  if (!item && itemsToShow.length === 0) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <p>No item selected.</p>
        <button onClick={() => navigate("/search")}>Go back to Search</button>
      </div>
    );
  }

  return (
    <>
      {/* ================= TOP SECTION ================= */}
      <section
        style={{
          backgroundColor: "rgba(149, 144, 139, 1)",
          minHeight: "50vh",
          padding: "150px 0"
        }}
      >
        <div className="container">
          <div
            style={{
              background: "#fff",
              borderRadius: "24px",
              padding: "35px",
              marginBottom: "40px",
              boxShadow: "0 15px 40px rgba(0,0,0,0.15)"
            }}
          >
            <h2 style={{ marginBottom: "20px" }}>Quote Items</h2>

            <div className="table-responsive">
              <table className="table align-middle" style={{ tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "16%" }} />
                </colgroup>

                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Description</th>
                    <th>Attributes</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {itemsToShow.map((i, idx) => (
                    <tr key={`${i.name}-${i.log_id}-${idx}`}>
                      <td><strong>{i.name}</strong></td>
                      <td>{i.short_description || "-"}</td>
                      <td>
                        <div
                          style={{
                            background: "#f7f7f7",
                            padding: "12px",
                            borderRadius: "10px",
                            fontSize: "14px",
                            maxHeight: "140px",
                            overflowY: "auto"
                          }}
                        >
                          {Object.entries(i.attributes || {}).map(([k, v]) => (
                            <div key={k}>
                              <strong>{k}:</strong>{" "}
                              {Array.isArray(v)
                                ? v.join(", ")
                                : typeof v === "boolean"
                                ? v
                                  ? "Yes"
                                  : "No"
                                : v}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="text-center">{i.quantity || 1}</td>
                      <td className="text-center">
                        <button
                          onClick={() => handleDelete(i.name, i.log_id)}
                          style={{
                            background: "red",
                            color: "#fff",
                            padding: "5px 10px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer"
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "20px" }}>
              <button
                onClick={() => navigate("/search")}
                style={{
                  backgroundColor: "#555",
                  color: "#fff",
                  padding: "10px 25px",
                  borderRadius: "20px",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Back to Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BOTTOM SECTION (HALF WIDTH FORM) ================= */}
      <section
        style={{
          backgroundColor: "#f4f4f4",
          padding: "80px 0"
        }}
      >
        <div className="container">
          <div
            style={{
              background: "#fff",
              borderRadius: "24px",
              padding: "35px",
              boxShadow: "0 15px 40px rgba(0,0,0,0.15)",
              maxWidth: "900px",
              margin: "0 auto"
            }}
          >
            <h2 style={{ marginBottom: "20px" }}>Your Details</h2>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <input
                    className="form-control"
                    name="firstName"
                    placeholder="First name"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <input
                    className="form-control"
                    name="lastName"
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-12">
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-12">
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12">
                  <textarea
                    className="form-control"
                    rows="4"
                    name="deliveryAddress"
                    placeholder="Delivery address"
                    value={form.deliveryAddress}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-12">
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      backgroundColor: "#f17c13",
                      color: "#fff",
                      padding: "12px 35px",
                      borderRadius: "30px",
                      fontWeight: 600,
                      width: "100%",
                      border: "none"
                    }}
                  >
                    {loading ? "Submitting..." : "Request Quote"}
                  </button>
                </div>
              </div>
            </form>

            {successMessage && (
              <p style={{ color: "green", marginTop: "15px" }}>
                {successMessage}
              </p>
            )}
            {errorMessage && (
              <p style={{ color: "red", marginTop: "15px" }}>
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
