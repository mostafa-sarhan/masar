import { useRef, useState, type FormEvent } from "react";
import { ScanLine, Printer, Truck, Trash2 } from "lucide-react";
import { getOrderByBarcode, bulkAssign } from "../api/orders-api";
import { orderColumns } from "../components/order-columns";
import { printCourierSheet } from "../lib/print";
import CourierSelect from "@/features/couriers/components/CourierSelect";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import Money from "@/components/ui/Money";
import { useFeedback } from "@/components/ui/feedback-context";
import { errorMessage } from "@/lib/errors";
import type { Order } from "@/lib/types";

// Scan pending orders (barcode reader or typing), then hand them all to one courier in one request.
export default function AssignCourierPage() {
  const { toast, confirm } = useFeedback();
  const [barcode, setBarcode] = useState("");
  const [scanned, setScanned] = useState<Order[]>([]);
  const [courier, setCourier] = useState("");
  const [courierName, setCourierName] = useState("");
  const [busy, setBusy] = useState(false);
  const scanning = useRef(false);
  const input = useRef<HTMLInputElement>(null);

  const total = scanned.reduce((sum, o) => sum + Number(o.cost || 0), 0);

  const scan = async (e: FormEvent) => {
    e.preventDefault();
    const code = barcode.trim();
    if (!code || scanning.current) return;
    scanning.current = true;
    try {
      if (scanned.some((o) => o.barcode === code)) return toast("هذه الشحنة مضافة بالفعل", "info");
      const order = await getOrderByBarcode(code);
      if (order.status !== "pending" || order.isArchived) return toast(`الشحنة ${code} ليست في المخزن، لا يمكن تسليمها`, "danger");
      setScanned((prev) => [order, ...prev]);
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setBarcode("");
      scanning.current = false;
      input.current?.focus();
    }
  };

  const assign = async () => {
    if (!(await confirm({ title: `تسليم ${scanned.length} شحنة إلى ${courierName}؟`, confirmLabel: "تسليم للمندوب" }))) return;
    try {
      setBusy(true);
      await bulkAssign(scanned.map((o) => o._id), courier);
      toast(`تم تسليم ${scanned.length} شحنة إلى ${courierName}`);
      printCourierSheet(scanned, courierName);
      setScanned([]);
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="تسليم للمناديب" description="امسح باركود الشحنات الموجودة في المخزن، ثم اختر المندوب وسلّمها دفعة واحدة." />
      <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
        <Panel title="المسح والتسليم" bodyClassName="space-y-4">
          <form onSubmit={scan}>
            <Field label="الباركود" hint="اضغط Enter بعد كل باركود، أو استخدم قارئ الباركود">
              {(p) => (
                <div className="relative">
                  <ScanLine className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
                  <Input {...p} ref={input} autoFocus dir="ltr" inputMode="numeric" value={barcode} onChange={(e) => setBarcode(e.target.value)} className="ps-9 text-base" autoComplete="off" />
                </div>
              )}
            </Field>
          </form>
          <Field label="المندوب">{(p) => <CourierSelect {...p} value={courier} onChange={setCourier} onPick={(c) => setCourierName(c?.name ?? "")} placeholder="اختر المندوب" />}</Field>
          <div className="rounded-md bg-sheet-2 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-2">عدد الشحنات</span>
              <b className="num text-ink">{scanned.length}</b>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-ink-2">إجمالي التحصيل</span>
              <b className="text-ink"><Money value={total} /></b>
            </div>
          </div>
          <Button className="w-full" size="lg" icon={<Truck className="size-4" />} disabled={!courier || !scanned.length} loading={busy} onClick={assign}>
            تسليم وطباعة كشف المندوب
          </Button>
          {scanned.length > 0 && courier && (
            <Button variant="quiet" className="w-full" icon={<Printer className="size-4" />} onClick={() => printCourierSheet(scanned, courierName)}>
              طباعة الكشف فقط
            </Button>
          )}
        </Panel>
        <Panel title="الشحنات الممسوحة">
          <DataTable
            caption="الشحنات الممسوحة"
            columns={orderColumns(["barcode", "customer", "address", "merchant", "cost"])}
            rows={scanned}
            rowKey={(o) => o._id}
            rowActions={(o) => (
              <Button variant="quiet" size="sm" icon={<Trash2 className="size-4" />} aria-label={`إزالة ${o.barcode}`} title="إزالة من القائمة" onClick={() => setScanned((s) => s.filter((x) => x._id !== o._id))} />
            )}
            empty={{ icon: <ScanLine />, title: "لم تُمسح أي شحنة بعد", description: "ابدأ بمسح أول باركود." }}
          />
        </Panel>
      </div>
    </>
  );
}
