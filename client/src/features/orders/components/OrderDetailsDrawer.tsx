import { useEffect, useState } from "react";
import { Copy, Printer, Pencil } from "lucide-react";
import { getOrder, getOrderHistory, trackingUrl } from "../api/orders-api";
import StatusTimeline from "./StatusTimeline";
import Barcode from "./Barcode";
import { printLabel } from "../lib/print";
import { Drawer } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Status";
import { Skeleton } from "@/components/ui/Feedback";
import { useFeedback } from "@/components/ui/feedback-context";
import Money from "@/components/ui/Money";
import { errorMessage } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/format-date";
import type { Order, AuditEventRow } from "@/lib/types";

const ACTIONS: Record<string, string> = { CREATE: "إنشاء", UPDATE: "تعديل", STATUS_CHANGE: "تغيير الحالة", DELETE: "حذف" };
const FIELDS: Record<string, string> = { status: "الحالة", courier: "المندوب", cost: "المبلغ", fullName: "الاسم", phone: "الهاتف", address: "العنوان", merchant: "التاجر", description: "الملاحظات", reason: "السبب", deliveredAt: "وقت الإغلاق", fees: "العمولات", isArchived: "الأرشفة", source: "المصدر" };

// The waybill of one order: details, status timeline, change history and the customer tracking link.
export default function OrderDetailsDrawer({ orderId, onClose, onEdit }: { orderId: string | null; onClose(): void; onEdit?(order: Order): void }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<AuditEventRow[]>([]);
  const { toast } = useFeedback();

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    Promise.all([getOrder(orderId), getOrderHistory(orderId)])
      .then(([o, h]) => {
        if (cancelled) return;
        setOrder(o);
        setHistory(h);
      })
      .catch((err) => toast(errorMessage(err), "danger"));
    return () => {
      cancelled = true;
      setOrder(null);
    };
  }, [orderId, toast]);

  const link = order ? trackingUrl(order.trackingId) : "";

  return (
    <Drawer
      open={!!orderId}
      onClose={onClose}
      title={order ? <span className="num">شحنة {order.barcode}</span> : "تفاصيل الشحنة"}
      description={order ? `أُنشئت ${formatDate(order.createdAt)}` : undefined}
      footer={
        order && (
          <>
            <Button variant="secondary" icon={<Printer className="size-4" />} onClick={() => printLabel(order)}>
              طباعة الملصق
            </Button>
            {onEdit && (
              <Button icon={<Pencil className="size-4" />} onClick={() => onEdit(order)}>
                تعديل
              </Button>
            )}
          </>
        )
      }
    >
      {!order ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="manifest flex items-center justify-between gap-4 px-4 pb-3 pt-5">
            <div className="text-ink [&_svg]:h-14 [&_svg]:max-w-44">
              <Barcode value={order.barcode} />
            </div>
            <StatusBadge status={order.status} className="text-sm" />
          </div>

          <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-2.5 text-sm">
            {[
              ["العميل", order.fullName],
              ["الهاتف", <span dir="ltr" className="num">{order.phone}</span>],
              ["العنوان", order.address],
              ["المبلغ", <b className="text-ink"><Money value={order.cost} /></b>],
              ["التاجر", order.merchant?.name ?? "—"],
              ["المندوب", order.courier?.name ?? "—"],
              ["ملاحظات", order.description || "—"],
              ...(order.reason ? [["السبب", order.reason]] : []),
              ...(order.merchantRef ? [["مرجع التاجر", <span dir="ltr">{order.merchantRef}</span>]] : []),
            ].map(([k, v]) => (
              <div key={String(k)} className="contents">
                <dt className="text-ink-3">{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink">رابط التتبع للعميل</h3>
            <div className="flex gap-2">
              <input readOnly value={link} dir="ltr" aria-label="رابط التتبع" className="h-9 min-w-0 flex-1 rounded-md border border-rule bg-sheet-2 px-3 text-xs text-ink-2" />
              <Button
                variant="secondary"
                size="sm"
                className="h-9"
                icon={<Copy className="size-4" />}
                onClick={() => navigator.clipboard?.writeText(link).then(() => toast("تم نسخ رابط التتبع"))}
              >
                نسخ
              </Button>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink">مراحل الشحنة</h3>
            <StatusTimeline events={order.statusHistory} showWho />
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-ink">سجل التعديلات</h3>
            <ul className="space-y-2 text-sm">
              {history.map((h) => (
                <li key={h._id} className="rounded-md bg-sheet-2 px-3 py-2">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-ink">{ACTIONS[h.action] ?? h.action}</span>
                    <span className="num text-xs text-ink-3">{formatDateTime(h.createdAt)}</span>
                  </div>
                  <div className="text-xs text-ink-3">{h.actor?.email ?? "الربط مع التاجر"}</div>
                  {h.changes && h.action !== "DELETE" && (
                    <ul className="mt-1 text-xs text-ink-2">
                      {Object.entries(h.changes)
                        .filter(([f]) => FIELDS[f])
                        .map(([f, c]) => (
                          <li key={f}>
                            {FIELDS[f]}: {typeof c.to === "object" ? "—" : String(c.to ?? "—")}
                          </li>
                        ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </Drawer>
  );
}
