import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Phone, MapPin, PackageCheck, RotateCcw, Ban, Repeat, Inbox } from "lucide-react";
import type { CourierOrder, CourierToday } from "@/lib/types";
import PortalLayout from "@/app/layouts/PortalLayout";
import Money from "@/components/ui/Money";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { Field, Textarea } from "@/components/ui/Field";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { useFeedback } from "@/components/ui/feedback-context";
import { getCourierOrders, getCourierToday, reportOutcome } from "@/lib/portals-api";
import { errorMessage } from "@/lib/errors";
import { statusLabel } from "@/lib/order-status";
import { cn } from "@/lib/cn";

type Outcome = "delivered" | "returned" | "refused" | "exchanged";

const OUTCOMES: { status: Outcome; Icon: typeof Ban; className: string; needsReason?: boolean }[] = [
  { status: "delivered", Icon: PackageCheck, className: "bg-ok text-white dark:text-paper col-span-2" },
  { status: "exchanged", Icon: Repeat, className: "bg-sheet-2 text-ink border border-rule" },
  { status: "returned", Icon: RotateCcw, className: "bg-late-soft text-late", needsReason: true },
  { status: "refused", Icon: Ban, className: "bg-stamp-soft text-stamp", needsReason: true },
];

const REASONS = ["العميل لا يرد", "العنوان غير صحيح", "العميل طلب التأجيل", "العميل رفض الاستلام"];

// Mobile-first: the courier's open orders, call / map, and one-tap outcomes.
export default function CourierAppPage() {
  const { toast, confirm } = useFeedback();
  const [orders, setOrders] = useState<CourierOrder[] | null>(null);
  const [today, setToday] = useState<CourierToday | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [asking, setAsking] = useState<{ order: CourierOrder; status: Outcome } | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(() => {
    Promise.all([getCourierOrders(), getCourierToday()])
      .then(([list, t]) => {
        setOrders(list);
        setToday(t);
      })
      .catch((err) => toast(errorMessage(err), "danger"));
  }, [toast]);

  useEffect(load, [load]);

  const save = async (order: CourierOrder, status: Outcome, why?: string) => {
    try {
      setBusy(order._id);
      await reportOutcome(order._id, status, why);
      toast(`${order.fullName}: ${statusLabel(status)}`);
      load();
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setBusy(null);
    }
  };

  const act = async (order: CourierOrder, outcome: (typeof OUTCOMES)[number]) => {
    if (outcome.needsReason) {
      setReason("");
      setAsking({ order, status: outcome.status });
      return;
    }
    if (await confirm({ title: `${statusLabel(outcome.status)}: ${order.fullName}؟`, description: `المبلغ المطلوب تحصيله ${order.cost}`, confirmLabel: statusLabel(outcome.status) })) {
      save(order, outcome.status);
    }
  };

  const submitReason = (e: FormEvent) => {
    e.preventDefault();
    if (!asking || !reason.trim()) return;
    save(asking.order, asking.status, reason.trim());
    setAsking(null);
  };

  return (
    <PortalLayout title="شحنات اليوم" narrow>
      {today ? (
        <section aria-label="ملخص اليوم" className="manifest mb-6 grid grid-cols-3 divide-x divide-x-reverse divide-rule text-center">
          <div className="py-3">
            <p className="text-xs text-ink-2">معك الآن</p>
            <p className="num text-2xl font-semibold text-ink">{today.open}</p>
          </div>
          <div className="py-3">
            <p className="text-xs text-ink-2">سلّمت اليوم</p>
            <p className="num text-2xl font-semibold text-ok">{today.delivered}</p>
          </div>
          <div className="py-3">
            <p className="text-xs text-ink-2">مرتجع ومرفوض</p>
            <p className="num text-2xl font-semibold text-stamp">{today.returned + today.refused}</p>
          </div>
          <div className="col-span-3 flex items-center justify-between border-t border-dashed border-rule px-4 py-3">
            <span className="text-sm text-ink-2">النقدية المطلوب تسليمها</span>
            <b className="text-lg text-ink"><Money value={today.cashToHandOver} /></b>
          </div>
        </section>
      ) : (
        <Skeleton className="mb-6 h-36" />
      )}

      {!orders ? (
        <div className="space-y-3">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon={<Inbox />} title="لا توجد شحنات معك الآن" description="ستظهر هنا الشحنات التي يسلّمها لك المكتب." />
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o._id} className="rounded-lg border border-rule bg-sheet p-4 shadow-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{o.fullName}</p>
                  <p className="mt-0.5 text-sm text-ink-2">{o.address}</p>
                </div>
                <b className="shrink-0 text-lg text-ink"><Money value={o.cost} /></b>
              </div>
              {o.description && <p className="mt-2 rounded-md bg-sheet-2 px-3 py-2 text-sm text-ink-2">{o.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a href={`tel:${o.phone}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-carbon px-3 text-sm font-medium text-carbon-ink">
                  <Phone className="size-4" aria-hidden />
                  <span dir="ltr" className="num">{o.phone}</span>
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-rule px-3 text-sm text-ink"
                >
                  <MapPin className="size-4" aria-hidden />
                  الخريطة
                </a>
                <span dir="ltr" className="num ms-auto text-xs text-ink-3">{o.barcode}</span>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {OUTCOMES.map((outcome) => (
                  <button
                    key={outcome.status}
                    disabled={busy === o._id}
                    onClick={() => act(o, outcome)}
                    className={cn("flex h-11 items-center justify-center gap-1.5 rounded-md text-sm font-medium cursor-pointer disabled:opacity-50", outcome.className, outcome.status !== "delivered" && "flex-col gap-0 text-xs")}
                  >
                    <outcome.Icon className="size-4" aria-hidden />
                    {statusLabel(outcome.status)}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!asking}
        onClose={() => setAsking(null)}
        title={asking ? `${statusLabel(asking.status)}: ${asking.order.fullName}` : ""}
        description="سيظهر السبب للمكتب وللتاجر."
      >
        <form onSubmit={submitReason} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button type="button" key={r} onClick={() => setReason(r)} className={cn("rounded-full border px-3 py-1.5 text-sm cursor-pointer", reason === r ? "border-carbon bg-carbon-soft text-carbon" : "border-rule text-ink-2")}>
                {r}
              </button>
            ))}
          </div>
          <Field label="السبب">{(p) => <Textarea {...p} required rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAsking(null)}>إلغاء</Button>
            <Button type="submit" disabled={!reason.trim()}>حفظ النتيجة</Button>
          </div>
        </form>
      </Modal>
    </PortalLayout>
  );
}
