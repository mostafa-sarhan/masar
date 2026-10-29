// Courier/company fee overrides for report pages. Empty = server default (shown as placeholder).
export interface FeeValues {
  courierFee: string;
  companyFee: string;
}

interface FeeInputsProps {
  value: FeeValues;
  onChange(value: FeeValues): void;
  defaults?: { courier: number; company: number } | null;
  onApply(): void;
  showCourier?: boolean;
  showCompany?: boolean;
}

export default function FeeInputs({ value, onChange, defaults, onApply, showCourier = true, showCompany = true }: FeeInputsProps) {
  const input = (name: keyof FeeValues, label: string) => (
    <>
      <span className="flex items-center">{label}</span>
      <input
        type="number"
        min="0"
        placeholder={String(defaults?.[name === "courierFee" ? "courier" : "company"] ?? "")}
        value={value[name]}
        onChange={(e) => onChange({ ...value, [name]: e.target.value })}
        onBlur={onApply}
        className="border rounded px-2 py-1 w-24"
      />
    </>
  );
  return (
    <>
      {showCourier && input("courierFee", "عمولة المندوب:")}
      {showCompany && input("companyFee", "عمولة الشركة:")}
    </>
  );
}
