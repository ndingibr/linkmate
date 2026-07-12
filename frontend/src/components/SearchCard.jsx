import React, { useState, useContext } from "react";
import { CartContext } from "../CartContext"; // make sure this path is correct

export default function SearchCard({ result }) {
  if (!result || !result.common_items) return null;

  const { addToCart } = useContext(CartContext);

  // Track quantity for each item
  const [quantities, setQuantities] = useState(
    () => result.common_items.reduce((acc, _, i) => ({ ...acc, [i]: 1 }), {})
  );

  // Track which items were recently added
  const [addedItems, setAddedItems] = useState({});

  const handleQuantityChange = (index, value) => {
    setQuantities(prev => ({ ...prev, [index]: value }));
  };

  const handleRequestQuote = (item, index) => {
    // Add to cart: use name as unique key
    addToCart({
      item_id: item.name,                       // use name instead of blank id
      name: item.name,
      short_description: item.short_description,
      attributes: item.attributes || {},        // include attributes
      quantity: quantities[index],
      log_id: sessionStorage.getItem("log_id") // <-- added log_id
    });

    // Show "Added!" feedback
    setAddedItems(prev => ({ ...prev, [index]: true }));

    // Remove the message after 2 seconds
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [index]: false }));
    }, 2000);
  };

  return (
    <>
      <div className="section-title mt-5">
        <div className="common-items-grid">
          <h2>Match Results</h2>
          <p>Enter quantity and click "Request Quote"</p>
        </div>
      </div>

      <div className="row gy-4">
        {result.common_items.map((item, index) => (
          <div key={index} className="col-md-6 col-lg-4">
            <div
              className="category-tile"
              style={{
                maxWidth: "700px",
                margin: "0 auto",
                padding: "20px",
                textAlign: "center",
                backgroundColor: "#fff",
                color: "#000",
                borderRadius: "20px",
                border: "1px solid #ccc",
              }}
            >
              <h4 style={{ marginBottom: "10px" }}>{item.name}</h4>
              <p style={{ fontSize: "14px", marginBottom: "10px" }}>
                {item.short_description}
              </p>

              <ul style={{ textAlign: "left", marginBottom: "15px" }}>
                {Object.entries(item.attributes || {}).map(([key, value]) => (
                  <li key={key}>
                    <strong>{key}:</strong>{" "}
                    {Array.isArray(value) ? value.join(", ") : value}
                  </li>
                ))}
              </ul>

              {/* Quantity input and Request Quote button */}
              <div style={{ marginTop: "10px" }}>
                <input
                  type="number"
                  min="1"
                  value={quantities[index]}
                  onChange={(e) =>
                    handleQuantityChange(index, parseInt(e.target.value, 10) || 1)
                  }
                  style={{
                    width: "60px",
                    marginRight: "10px",
                    padding: "6px 10px",
                    borderRadius: "15px",
                    border: "2px solid #999",
                    backgroundColor: "white",
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => handleRequestQuote(item, index)}
                  style={{
                    padding: "6px 15px",
                    borderRadius: "15px",
                    border: "2px solid #999",
                    backgroundColor: "white",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f17c13")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "white")
                  }
                >
                  Request Quote
                </button>

                {/* Feedback message */}
                {addedItems[index] && (
                  <span
                    style={{
                      marginLeft: "10px",
                      color: "#28a745",
                      fontWeight: "600",
                    }}
                  >
                    Added!
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
