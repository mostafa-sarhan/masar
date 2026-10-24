import { useEffect, useState } from "react";
import { getMerchantOptions } from "./services/resourcesApi";

// Merchant (company) dropdown; value is the merchant id.
export default function MerchantSelect({ value, onChange, placeholder = "اختر الشركة", className = "border rounded-lg p-2", required }) {
  const [merchants, setMerchants] = useState([]);

  useEffect(() => {
    getMerchantOptions().then(setMerchants).catch(console.error);
  }, []);

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className} required={required}>
      <option value="">{placeholder}</option>
      {merchants.map((m) => (
        <option key={m._id} value={m._id}>{m.name}</option>
      ))}
    </select>
  );
}
