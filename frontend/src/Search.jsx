import React, { useState } from "react";
import { searchQuery } from "./api";
import Source from "./components/Source";
import CategoryTiles from "./components/CategoryTiles";
import SearchCard from "./components/SearchCard";
import QuoteCartIcon from "./components/QuoteCartIcon";

/* ---------- UTILS ---------- */
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getSessionId() {
  let id = sessionStorage.getItem("session_id");
  if (!id) {
    id = generateUUID();
    sessionStorage.setItem("session_id", id);
  }
  return id;
}

function getAnonymousDeviceId() {
  let id = localStorage.getItem("anon_device_id");
  if (!id) {
    id = generateUUID();
    localStorage.setItem("anon_device_id", id);
  }
  return id;
}

/* ---------- PAGE ---------- */
export default function Search() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ✅ CART IN MEMORY */
  const [cart, setCart] = useState({
    session_id: getSessionId(),
    anon_device_id: getAnonymousDeviceId(),
    items: []
  });

  /* ✅ REQUEST QUOTE HANDLER */
  const onRequestQuote = (itemWithQuantity) => {
    setCart(prev => {
      const { name, attributes, quantity, log_id } = itemWithQuantity;

      const existing = prev.items.find(
        i => i.name === name && i.log_id === log_id
      );

      // Same item + same log_id → increase quantity
      if (existing) {
        return {
          ...prev,
          items: prev.items.map(i =>
            i.name === name && i.log_id === log_id
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        };
      }

      // New line item (different log_id allowed)
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            name,
            attributes: attributes || {},
            quantity,
            log_id // ✅ stored per line item
          }
        ]
      };
    });
  };

  /* 🔢 TOTAL ITEMS FOR BADGE */
  const cartItemCount = cart.items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  /* 🔍 SEARCH LOGIC */
  const handleSearchWithQuery = async (searchValue) => {
    const q = searchValue || query;
    if (!q.trim()) {
      setError("Please enter what you are looking for");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const clientInfo = {
        session_id: cart.session_id,
        anon_device_id: cart.anon_device_id,
        user_agent: navigator.userAgent,
        platform: navigator.platform
      };

      const payload = {
        query: q,
        client_info: clientInfo
      };

      const data = await searchQuery(payload);
      
      // ✅ Extract log_id from backend response and save in sessionStorage
      if (data && data.log_id) {
        sessionStorage.setItem("log_id", data.log_id);
        console.log("Saved log_id in sessionStorage:", data.log_id);
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Search failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };


  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    handleSearchWithQuery();
  };

  /* DEBUG */
  console.log("CART IN MEMORY:", cart);

  return (
    <>
      <QuoteCartIcon count={cartItemCount} />

      <section className="search-page section">
        <div className="container">

          {!result && (
            <CategoryTiles
              onCategoryClick={(preset) => {
                setQuery(preset);
                handleSearchWithQuery(preset);
              }}
            />
          )}

          {result && result.common_items && (
            <SearchCard
              result={result}
              onRequestQuote={onRequestQuote}
            />
          )}

          {error && <p className="error-message">{error}</p>}
        </div>
      </section>

      <section className="section" style={{ backgroundColor: "#f17c13" }}>
        <Source
          query={query}
          setQuery={setQuery}
          handleSearch={handleSearch}
          loading={loading}
          error={error}
        />
      </section>
    </>
  );
}
