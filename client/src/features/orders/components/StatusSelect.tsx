import { Combobox, type ComboOption } from "@/components/ui/Combobox";
import { ORDER_STATUSES, statusLabel } from "@/lib/order-status";

const OPTIONS: ComboOption[] = ORDER_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }));

// Order status filter.
export default function StatusSelect({ value, onChange, placeholder = "كل الحالات", ...rest }: { value: string; onChange(status: string): void; placeholder?: string; className?: string; "aria-label"?: string }) {
  return <Combobox value={value} onChange={(s) => onChange(s)} options={OPTIONS} placeholder={placeholder} {...rest} />;
}
