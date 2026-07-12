import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getQuoteByNumber, payQuote } from "./api";

export default function PayQuote() {
  const { quoteNumber } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    getQuoteByNumber(quoteNumber)
      .then((data) => setQuote(data))
      .catch(() => setError("Quote not found"))
      .finally(() => setLoading(false));
  }, [quoteNumber]);

const handlePayNow = async () => {
  if (!quote) return;

  setPaying(true);
  try {
    console.log(quote);

    // Backend returns RAW HTML form (not JSON)
    const html = await payQuote(quote.quote_no);

    // Replace current page with PayFast form and auto-submit
    document.open();
    document.write(html);
    document.close();
  } catch (err) {
    console.error(err);
    alert("Payment failed. Please try again.");
  } finally {
    setPaying(false);
  }
};

  if (loading) return <p style={{ textAlign: "center", marginTop: "60px" }}>Loading quote...</p>;
  if (error) return <p style={{ textAlign: "center", marginTop: "60px", color: "red" }}>{error}</p>;

  return (
    <>
      {/* ================= TOP SECTION — Quote Items ================= */}
      <section
        style={{
          backgroundColor: "rgba(149, 144, 139, 1)",
          minHeight: "50vh",
          padding: "100px 0"
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
            <p style={{ color: "#555", marginBottom: "20px" }}>
              Quote #{quote?.quote_number} — Created: {new Date(quote?.created_at).toLocaleString()}
            </p>

            <div className="table-responsive">
              <table className="table align-middle" style={{ tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "35%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "25%" }} />
                </colgroup>

                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Attributes</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-center">Price</th>
                  </tr>
                </thead>

                <tbody>
                  {quote?.lines?.map((line) => {
                    const attributes = JSON.parse(line.item_attributes || "{}");
                    const unitPrice = parseFloat(attributes.Price?.replace(/[^\d.]/g, "")) || 0;
                    return (
                      <tr key={line.id}>
                        <td><strong>{line.item_name}</strong></td>
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
                            {Object.entries(attributes).map(([k, v]) => (
                              <div key={k}>
                                <strong>{k}:</strong>{" "}
                                {Array.isArray(v)
                                  ? v.join(", ")
                                  : typeof v === "boolean"
                                  ? v ? "Yes" : "No"
                                  : v}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="text-center">{line.quantity}</td>
                        <td className="text-center">R{(unitPrice * line.quantity).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p
              style={{
                marginTop: "20px",
                fontWeight: "bold",
                textAlign: "right",
                fontSize: "18px",
                color: "#f17c13"
              }}
            >
              Total: R{quote?.price.toFixed(2)}
            </p>
          </div>
        </div>
      </section>

      {/* ================= BOTTOM SECTION — Customer Details + Pay ================= */}
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
            <h2 style={{ marginBottom: "20px", color: "#f17c13" }}>Customer Details</h2>

            <p><strong>Name:</strong> {quote?.first_name} {quote?.last_name}</p>
            <p><strong>Email:</strong> {quote?.email}</p>
            <p><strong>Phone:</strong> {quote?.phone}</p>
            <p><strong>Delivery Address:</strong> {quote?.delivery_address}</p>
      <button
        onClick={handlePayNow}
        disabled={paying || quote?.pay === 1} // ✅ disable if paying OR quote already paid
        style={{
          marginTop: "20px",
          backgroundColor: (quote?.pay === 1 ? "#ccc" : "#f17c13"), // gray if paid
          color: "#fff",
          padding: "12px 35px",
          borderRadius: "30px",
          fontWeight: 600,
          width: "100%",
          border: "none",
          cursor: (quote?.pay === 1 ? "not-allowed" : "pointer") // cursor change
        }}
      >
        {quote?.pay === 1 ? "Quote Paid" : (paying ? "Redirecting..." : "Pay Now")}
      </button>
          </div>
        </div>
      </section>
    </>
  );
}
