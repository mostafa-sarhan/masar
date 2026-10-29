import { Input } from "@/components/ui/Field";

export interface FeeValues {
  courierFee: string;
  companyFee: string;
}

// "What-if" fees for owners/admins. Empty = the fees stored on each delivered order.
export default function FeeInputs({ value, onChange, defaults, showCourier = true, showCompany = true }: { value: FeeValues; onChange(v: FeeValues): void; defaults?: { courier: number; company: number } | null; showCourier?: boolean; showCompany?: boolean }) {
  const input = (name: keyof FeeValues, label: string, def?: number) => (
    <label className="flex items-center gap-2 text-sm text-ink-2">
      {label}
      <Input type="number" min={0} step="0.01" dir="ltr" className="h-9 w-24" placeholder={def === undefined ? "" : String(def)} value={value[name]} onChange={(e) => onChange({ ...value, [name]: e.target.value })} />
    </label>
  );
  return (
    <div className="flex flex-wrap items-center gap-3" title="اتركها فارغة لاستخدام العمولات المحفوظة على الشحنات">
      {showCourier && input("courierFee", "عمولة المندوب", defaults?.courier)}
      {showCompany && input("companyFee", "عمولة الشركة", defaults?.company)}
    </div>
  );
}
