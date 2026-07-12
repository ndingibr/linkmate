import React from "react";
import { Sun, Plug, Factory, Laptop, Building2, Sofa, Wrench, Tractor, Car } from "lucide-react";

// CATEGORY CONFIG
const CATEGORIES = [
  { title: "Solar & Power Solutions", description: "Solar panels, inverters, batteries, backup power systems", Icon: Sun, preset: "solar inverter lithium battery" },
  { title: "Electrical Appliances & Equipment", description: "Home appliances, cables, switches, lighting, breakers", Icon: Plug, preset: "electrical equipment" },
  { title: "Machinery & Industrial Equipment", description: "Generators, pumps, compressors, factory machinery", Icon: Factory, preset: "industrial machinery" },
  { title: "ICT & Office Equipment", description: "Computers, printers, POS systems, office electronics", Icon: Laptop, preset: "office equipment" },
  { title: "Building & Construction Materials", description: "Roofing, plumbing, tiles, doors, hardware", Icon: Building2, preset: "building materials" },
  { title: "Furniture & Home Fixtures", description: "Office furniture, home furniture, fittings", Icon: Sofa, preset: "furniture" },
  { title: "Tools, Hardware & Safety Equipment", description: "Hand tools, power tools, PPE, fixings", Icon: Wrench, preset: "tools and safety equipment" },
  { title: "Agricultural Tools & Small Equipment", description: "Irrigation kits, pumps, farm tools", Icon: Tractor, preset: "agricultural equipment" },
  { title: "Vehicle Spare Parts", description: "Engines, gearboxes, brakes, sensors", Icon: Car, preset: "vehicle spare parts" },
];

export default function CategoryTiles({ onCategoryClick = true }) {
  return (
    <>
      <div className="section-title mt-5">
        <h2>Popular Categories</h2>
        <p>Click a category to instantly search common items</p>
      </div>

      <div className="row gy-4">
        {CATEGORIES.map((cat, index) => {
          const Icon = cat.Icon;
          return (
            <div key={index} className="col-md-6 col-lg-4">
              <div
                className="category-tile"
                onClick={() => {
                  // Call parent handler to update query and trigger search
                  if (onCategoryClick) onCategoryClick(cat.preset);
                }}
              >
                <div className="category-icon">
                  <Icon size={32} />
                </div>
                <h4>{cat.title}</h4>
                <p>{cat.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
