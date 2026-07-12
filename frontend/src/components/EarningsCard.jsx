import React from "react";

export default function EarningsCard({ item }) {
  const formatMarketCap = (value) => {
    const num = Number(value);
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    return num;
  };

  return (
    <div
      className="category-tile"
      style={{
        padding: "20px",
        backgroundColor: "#fff",
        borderRadius: "20px",
        border: "1px solid #ccc",
        height: "100%",
      }}
    >
      <h4>{item.company}</h4>
      <p style={{ fontWeight: "600", color: "#f17c13" }}>
        {item.symbol}
      </p>

      <ul style={{ textAlign: "left", marginTop: "10px" }}>
        <li><strong>Date:</strong> {item.date}</li>
        <li><strong>EPS Forecast:</strong> {item.epsforecast}</li>
        <li><strong>Time:</strong> {item.time}</li>
        <li>
          <strong>Market Cap:</strong> {formatMarketCap(item.marketcap)}
        </li>
      </ul>
    </div>
  );
}