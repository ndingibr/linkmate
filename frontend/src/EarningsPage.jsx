import React, { useEffect, useState } from "react";
import EarningsCard from "./components/EarningsCard";
import { getEarnings } from "./api"; // ✅ import API function

export default function EarningsPage() {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchEarnings = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getEarnings(100); // ✅ use API layer

      console.log("Earnings response:", data);

      setEarnings(data.earnings || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  return (
    <section className="section">
      <div className="container">
        <div className="section-title mt-5">
          <h2>Earnings Calendar</h2>
          <p>Companies reporting earnings</p>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="error-message">{error}</p>}

        <div className="row gy-4">
          {earnings.map((item, index) => (
            <div key={index} className="col-md-6 col-lg-4">
              <EarningsCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}