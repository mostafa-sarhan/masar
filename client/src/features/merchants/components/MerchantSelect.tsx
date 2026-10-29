import { useEffect, useState, type SelectHTMLAttributes } from "react";
import { getMerchantOptions } from "@/lib/resources-api";
import { Select } from "@/components/ui/Field";

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> & { value: string; onChange(id: string): void; placeholder?: string };

// Merchant dropdown; value is the merchant id.
export default function MerchantSelect({ value, onChange, placeholder = "كل التجار", ...rest }: Props) {
  const [merchants, setMerchants] = useState<{ _id: string; name: string }[]>([]);
  useEffect(() => {
    getMerchantOptions().then(setMerchants).catch(console.error);
  }, []);
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      <option value="">{rest.required ? "اختر التاجر" : placeholder}</option>
      {merchants.map((m) => (
        <option key={m._id} value={m._id}>
          {m.name}
        </option>
      ))}
    </Select>
  );
}
