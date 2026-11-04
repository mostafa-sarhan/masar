import { useEffect, useState } from "react";
import { Combobox, type ComboOption } from "@/components/ui/Combobox";
import { getZones } from "@/lib/resources-api";

// The company's shipping zones (a short list, loaded once).
export default function ZoneSelect({ value, onChange, placeholder = "كل المناطق", ...rest }: { value: string; onChange(id: string): void; placeholder?: string; className?: string; "aria-label"?: string }) {
  const [options, setOptions] = useState<ComboOption[]>([]);
  useEffect(() => {
    getZones()
      .then((zones) => setOptions(zones.map((z) => ({ value: z._id, label: z.name }))))
      .catch(() => setOptions([]));
  }, []);
  return <Combobox value={value} onChange={(id) => onChange(id)} options={options} placeholder={placeholder} emptyText="لا توجد مناطق" {...rest} />;
}
