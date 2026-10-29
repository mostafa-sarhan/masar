import { useState } from "react";
import type { OrderStatus } from "@masar/shared";
import type { Order } from "@/lib/types";
import CourierSelect from "@/features/couriers/components/CourierSelect";
import { bulkAssign, bulkStatus } from "@/features/orders/api/orders-api";
import { errorMessage } from "@/lib/errors";
import { printLabels } from "@/features/orders/lib/print";
import { ORDER_STATUSES, statusLabel } from "@/lib/order-status";

// Action bar for selected orders. The server validates everything and applies all-or-nothing.
export default function BulkActions({ selected, onDone, onClear }: { selected: Order[]; onDone(): void; onClear(): void }) {
  const [courier, setCourier] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const ids = selected.map((o) => o._id);

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      alert(success);
      onDone();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  return (
    <div className="w-[98%] m-auto my-2 p-3 rounded-lg bg-edit flex flex-wrap gap-3 items-center">
      <strong>{selected.length} محدد</strong>
      <CourierSelect value={courier} onChange={setCourier} />
      <button disabled={!courier} onClick={() => run(() => bulkAssign(ids, courier), "تم تسليم الأوردرات للمندوب ✅")} className="bg-green-600 px-3 py-2 rounded disabled:opacity-50">
        تسليم للمندوب
      </button>
      <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "")} className="border-2 rounded-lg px-3 py-2 text-black bg-white">
        <option value="">تغيير الحالة إلى...</option>
        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
      </select>
      <button disabled={!status} onClick={() => run(() => bulkStatus(ids.map((id) => ({ id, status: status as OrderStatus }))), "تم تغيير الحالة ✅")} className="bg-blue-600 px-3 py-2 rounded disabled:opacity-50">
        تطبيق
      </button>
      <button onClick={() => printLabels(selected)} className="bg-orange-500 px-3 py-2 rounded">طباعة الملصقات</button>
      <button onClick={onClear} className="underline">إلغاء التحديد</button>
    </div>
  );
}
