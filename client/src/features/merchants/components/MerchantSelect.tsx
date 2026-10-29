import { useEffect, useState } from "react";
import { getMerchantOptions } from "@/lib/resources-api";

// Merchant (company) dropdown; value is the merchant id.
interface MerchantSelectProps {
  value: string;
  onChange(id: string): void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function MerchantSelect({ value, onChange, placeholder = "اختر الشركة", className = "border rounded-lg p-2", required }: MerchantSelectProps) {
  const [merchants, setMerchants] = useState<{ _id: string; name: string }[]>([]);

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
