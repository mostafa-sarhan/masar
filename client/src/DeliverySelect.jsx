import React, { useEffect, useState } from "react";

export const DELIVERY_URL = "https://sys-shipping-backend.onrender.com/deliveries";

export default function DeliverySelect({ value, onChange }) {
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetchDeliveries = async () => {
      try {
        const res = await fetch(DELIVERY_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setDeliveries(data);
      } catch (error) {
        console.error("فشل جلب المندوبين:", error);
      }
    };

    fetchDeliveries();
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
