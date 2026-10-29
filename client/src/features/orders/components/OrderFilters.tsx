import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { OrderStatus } from "@masar/shared";
import { Input, Select } from "@/components/ui/Field";
import CourierSelect from "@/features/couriers/components/CourierSelect";
import MerchantSelect from "@/features/merchants/components/MerchantSelect";
import { statusLabel } from "@/lib/order-status";
import { toLatinDigits } from "@/lib/digits";

export type Filters = {
  search: string;
  status: string;
  merchant: string;
  courier: string;
  date: string;
};

// Search waits for a pause in typing before it filters.
export function OrderFilters({ value, onChange, statuses, showCourier = true }: { value: Filters; onChange(f: Filters): void; statuses: readonly OrderStatus[]; showCourier?: boolean }) {
  const [search, setSearch] = useState(value.search);
  useEffect(() => {
    if (search === value.search) return;
    const t = setTimeout(() => onChange({ ...value, search }), 350);
    return () => clearTimeout(t);
  }, [search, value, onChange]);

  const set = (key: keyof Filters) => (v: string) => onChange({ ...value, [key]: v });

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(14rem,1.4fr)_repeat(4,minmax(9rem,1fr))]">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <Input
          value={search}
          onChange={(e) => setSearch(toLatinDigits(e.target.value).replace(/[^\d+A-Za-z-]/g, ""))}
          placeholder="رقم الهاتف أو الباركود"
          aria-label="بحث برقم الهاتف أو الباركود"
          className="ps-9"
          inputMode="numeric"
        />
      </div>
      <Select value={value.status} onChange={(e) => set("status")(e.target.value)} aria-label="الحالة">
        <option value="">كل الحالات</option>
        {statuses.map((s) => (
          <option key={s} value={s}>
            {statusLabel(s)}
          </option>
        ))}
      </Select>
      <MerchantSelect value={value.merchant} onChange={set("merchant")} aria-label="التاجر" />
      {showCourier && <CourierSelect value={value.courier} onChange={set("courier")} aria-label="المندوب" />}
      <Input type="date" value={value.date} onChange={(e) => set("date")(e.target.value)} aria-label="تاريخ الإنشاء" />
    </div>
  );
}
