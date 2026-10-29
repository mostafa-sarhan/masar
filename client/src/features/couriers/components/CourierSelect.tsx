import { useEffect, useState, type SelectHTMLAttributes } from "react";
import { getCouriers } from "@/lib/resources-api";
import { Select } from "@/components/ui/Field";
import type { Courier } from "@/lib/types";

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> & {
  value: string;
  onChange(id: string): void;
  onLoaded?(couriers: Courier[]): void;
  placeholder?: string;
};

// Courier dropdown; value is the courier id. `onLoaded` receives the list (for names).
export default function CourierSelect({ value, onChange, onLoaded, placeholder = "كل المناديب", ...rest }: Props) {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  useEffect(() => {
    getCouriers()
      .then((list) => {
        setCouriers(list);
        onLoaded?.(list);
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      <option value="">{placeholder}</option>
      {couriers.map((c) => (
        <option key={c._id} value={c._id}>
          {c.name}
        </option>
      ))}
    </Select>
  );
}
