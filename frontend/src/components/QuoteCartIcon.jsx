import React, { useContext } from "react";
import { FileText } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { CartContext } from "../CartContext";

export default function QuoteCartIcon() {
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Do not show the floating navigation and cart on Login or Register pages
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "2rem",
        right: "2rem",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      {/* Quote Cart Icon */}
      <div
        onClick={() => navigate("/quote")}
        style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          backgroundColor: "#fff",
          border: "2px solid #f17c13",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
          position: "relative",
          cursor: "pointer",
        }}
      >
        <FileText size={28} strokeWidth={2} color="#f17c13" />
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              backgroundColor: "#f17c13",
              color: "#fff",
              borderRadius: "50%",
              minWidth: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: "600",
              lineHeight: 1,
            }}
          >
            {count}
          </span>
        )}
      </div>
    </div>
  );
}
