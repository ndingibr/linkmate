import { Link } from "react-router-dom";
import { useEffect } from "react";
import { FileText } from "lucide-react";

export default function SearchCard({ item, log_id }) {
  useEffect(() => {
    if (log_id) {
      console.log("SearchCard received log_id:", log_id);
    }
  }, [log_id]);

  if (!item) return null;

  return (
    <div className="col-md-6 col-lg-4">
      <div className="category-tile">
        {/* ICON / IMAGE */}
        <div className="category-icon">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              onError={(e) => (e.target.style.display = "none")}
              style={{ maxWidth: 32, maxHeight: 32 }}
            />
          ) : (
            <FileText size={32} />
          )}
        </div>

        {/* TITLE */}
        <h4>{item.name}</h4>

        {/* DESCRIPTION */}
        <p>
          {item.short_description || "Request a quote for this item"}
        </p>

        {/* CTA — styled by existing tile styles */}
        <Link
          to="/quote"
          state={{ item, log_id }}
          onClick={() =>
            console.log("Navigating to Quote with log_id:", log_id)
          }
          style={{ marginTop: "auto", fontWeight: 600 }}
        >
          Get Quote →
        </Link>
      </div>
    </div>
  );
}
