import type { Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Status";
import Money from "@/components/ui/Money";
import { formatDate } from "@/lib/format-date";
import { placeLabel } from "@masar/shared";
import type { Order } from "@/lib/types";

type Key = "barcode" | "customer" | "address" | "merchant" | "courier" | "status" | "cost" | "date";

// Column definitions shared by every order table (orders, archive, assignment, courier batch).
export function orderColumns<T extends Order = Order>(keys: Key[] = ["barcode", "customer", "address", "merchant", "courier", "status", "cost", "date"]): Column<T>[] {
  const all: Record<Key, Column<T>> = {
    barcode: {
      key: "barcode",
      header: "الشحنة",
      primary: true,
      cell: (o) => (
        <div className="leading-tight">
          <div className="num font-medium text-ink">{o.barcode}</div>
          <div className="text-xs text-ink-3 md:hidden">{o.fullName}</div>
        </div>
      ),
    },
    customer: {
      key: "customer",
      header: "العميل",
      cell: (o) => (
        <div className="leading-tight">
          <div className="text-ink">{o.fullName}</div>
          <div className="num text-xs text-ink-3" dir="ltr">
            {o.phone}
          </div>
        </div>
      ),
    },
    address: {
      key: "address",
      header: "الوجهة",
      cell: (o) => (
        <div className="max-w-56 leading-tight">
          {o.governorate && <div className="text-ink">{placeLabel(o.governorate, o.city)}</div>}
          <div className="line-clamp-2 text-xs text-ink-3">{o.address}</div>
        </div>
      ),
    },
    merchant: { key: "merchant", header: "التاجر", cell: (o) => <span className="text-ink-2">{o.merchant?.name ?? "—"}</span> },
    courier: { key: "courier", header: "المندوب", cell: (o) => <span className="text-ink-2">{o.courier?.name ?? "—"}</span> },
    status: { key: "status", header: "الحالة", cell: (o) => <StatusBadge status={o.status} /> },
    cost: { key: "cost", header: "المبلغ", align: "end", cell: (o) => <span className="font-medium text-ink"><Money value={o.cost} /></span> },
    date: { key: "date", header: "التاريخ", hideOnMobile: true, cell: (o) => <span className="num whitespace-nowrap text-ink-3">{formatDate(o.createdAt)}</span> },
  };
  return keys.map((k) => all[k]);
}
