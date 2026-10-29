import { useState } from "react";
import { Printer, Truck, X } from "lucide-react";
import type { OrderStatus } from "@masar/shared";
import CourierSelect from "@/features/couriers/components/CourierSelect";
import { bulkAssign, bulkStatus } from "../api/orders-api";
import { printLabels } from "../lib/print";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { useFeedback } from "@/components/ui/feedback-context";
import { errorMessage } from "@/lib/errors";
import { ORDER_STATUSES, statusLabel } from "@/lib/order-status";
import type { Order } from "@/lib/types";

// Sticky bar for the selected orders. The server validates everything and saves all or nothing.
export default function BulkActions({ selected, onDone, onClear }: { selected: Order[]; onDone(): void; onClear(): void }) {
  const [courier, setCourier] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [busy, setBusy] = useState(false);
  const { toast, confirm } = useFeedback();
  const ids = selected.map((o) => o._id);

  const run = async (question: { title: string; confirmLabel: string }, action: () => Promise<unknown>, done: string) => {
    if (!(await confirm({ ...question, description: "إذا تعذّر تنفيذ الإجراء على أي شحنة، لن يُحفظ أي تغيير." }))) return;
    try {
      setBusy(true);
      await action();
      toast(done);
      onDone();
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sticky bottom-3 z-20 mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-rule bg-sheet px-3 py-2.5 shadow-2">
      <span className="num px-1 text-sm font-semibold text-ink">{selected.length} محدد</span>
      <div className="flex items-center gap-2">
        <CourierSelect value={courier} onChange={setCourier} placeholder="اختر مندوبًا" className="h-9 w-40" aria-label="المندوب" />
        <Button
          size="sm"
          className="h-9"
          icon={<Truck className="size-4" />}
          disabled={!courier || busy}
          onClick={() => run({ title: `تسليم ${selected.length} شحنة للمندوب؟`, confirmLabel: "تسليم" }, () => bulkAssign(ids, courier), "تم تسليم الشحنات للمندوب")}
        >
          تسليم
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "")} className="h-9 w-40" aria-label="الحالة الجديدة">
          <option value="">تغيير الحالة إلى</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </Select>
        <Button
          size="sm"
          variant="secondary"
          className="h-9"
          disabled={!status || busy}
          onClick={() => run({ title: `تغيير حالة ${selected.length} شحنة إلى "${statusLabel(status)}"؟`, confirmLabel: "تغيير الحالة" }, () => bulkStatus(ids.map((id) => ({ id, status: status as OrderStatus }))), "تم تغيير الحالة")}
        >
          تطبيق
        </Button>
      </div>
      <Button size="sm" variant="secondary" className="h-9" icon={<Printer className="size-4" />} onClick={() => printLabels(selected)}>
        طباعة الملصقات
      </Button>
      <Button size="sm" variant="quiet" className="ms-auto h-9" icon={<X className="size-4" />} onClick={onClear}>
        إلغاء التحديد
      </Button>
    </div>
  );
}
