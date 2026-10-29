import Barcode from "./Barcode";
import { formatDate } from "./utils/dataUtils";
import { statusLabel } from "./utils/orderStatus";

// Header + row for the shared 10-column orders grid.
// `selection` (optional): { all, onToggleAll } adds a select-all checkbox to the first column.
export function OrdersHeader({ lastColumn = "ملاحظه", selection }) {
  const columns = ["التاريخ", "الباركود", "العنوان", "المرسل إليه", "الحالة", "الشركة", "المندوب", "المبلغ", lastColumn];
  return (
    <div className="orders-grid border-2 rounded-lg font-bold">
      <div className="orders-cell gap-1">
        {selection && <input type="checkbox" checked={selection.all} onChange={selection.onToggleAll} aria-label="تحديد الكل" />}
        العدد
      </div>
      {columns.map((c) => (
        <div key={c} className="orders-cell">{c}</div>
      ))}
    </div>
  );
}

export function OrderRow({ order, index, status, actions, selected, onToggle }) {
  return (
    <div className={`orders-grid border-x-2 border-t-2 ${selected ? "bg-white/10" : ""}`}>
      <div className="orders-cell gap-1">
        {onToggle && <input type="checkbox" checked={!!selected} onChange={onToggle} aria-label="تحديد" />}
        <span className="text-sm">{index}</span>
      </div>
      <div className="orders-cell"><span className="text-sm">{formatDate(order.createdAt)}</span></div>
      <div className="orders-cell"><Barcode value={order.barcode} /></div>
      <div className="orders-cell">{order.address}</div>
      <div className="orders-cell flex-col">
        <span>{order.fullName}</span>
        <span className="text-sm">{order.phone}</span>
      </div>
      <div className="orders-cell font-semibold">{status ?? statusLabel(order.status)}</div>
      <div className="orders-cell">{order.merchant?.name || "-"}</div>
      <div className="orders-cell">{order.courier?.name || "-"}</div>
      <div className="orders-cell font-bold">{order.cost}</div>
      <div className="orders-cell gap-2">{actions}</div>
    </div>
  );
}
