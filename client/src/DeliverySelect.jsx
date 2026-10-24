import React, { useEffect, useState } from "react";
import { getDeliveries } from "./services/resourcesApi";

export default function DeliverySelect({ value, onChange }) {
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    getDeliveries()
      .then(setDeliveries)
      .catch((error) => console.error("فشل جلب المندوبين:", error));
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border-2 rounded-lg px-3 py-2 max-w-full"
    >
      <option value="">-- اختر المندوب --</option>
      {deliveries.map((d) => (
        <option key={d._id} value={d.name}>
          {d.name}
        </option>
      ))}
    </select>
  );
}
