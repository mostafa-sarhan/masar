import { useEffect, useState } from "react";
import { getCouriers } from "./services/resourcesApi";

// Courier dropdown; value is the courier id. onLoaded receives the list (for names).
export default function CourierSelect({ value, onChange, onLoaded, placeholder = "-- اختر المندوب --", className = "border-2 rounded-lg px-3 py-2 max-w-full" }) {
  const [couriers, setCouriers] = useState([]);

  useEffect(() => {
    getCouriers()
      .then((list) => {
        setCouriers(list);
        onLoaded?.(list);
      })
      .catch((err) => console.error("فشل جلب المندوبين:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">{placeholder}</option>
      {couriers.map((c) => (
        <option key={c._id} value={c._id}>{c.name}</option>
      ))}
    </select>
  );
}
