import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { OrderStatus } from "@masar/shared";
import { Input } from "@/components/ui/Field";
import { Combobox } from "@/components/ui/Combobox";
import CourierSelect from "@/features/couriers/components/CourierSelect";
import MerchantSelect from "@/features/merchants/components/MerchantSelect";
import { GovernorateSelect } from "@/features/locations/components/PlaceSelects";
import ZoneSelect from "@/features/zones/components/ZoneSelect";
import { statusLabel } from "@/lib/order-status";
import { toLatinDigits } from "@/lib/digits";
import type { Filters } from "../lib/filters";


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
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
      <Combobox value={value.status} onChange={set("status")} options={statuses.map((s) => ({ value: s, label: statusLabel(s) }))} placeholder="كل الحالات" aria-label="الحالة" />
      <MerchantSelect value={value.merchant} onChange={set("merchant")} aria-label="التاجر" />
      {showCourier && <CourierSelect value={value.courier} onChange={set("courier")} aria-label="المندوب" />}
      <GovernorateSelect value={value.governorate} onChange={set("governorate")} aria-label="المحافظة" />
      <ZoneSelect value={value.zone} onChange={set("zone")} aria-label="منطقة الشحن" />
      <Input type="date" value={value.date} onChange={(e) => set("date")(e.target.value)} aria-label="تاريخ الإنشاء" />
    </div>
  );
}
