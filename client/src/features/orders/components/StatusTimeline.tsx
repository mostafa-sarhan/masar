import type { OrderStatus } from "@masar/shared";
import { statusLabel } from "@/lib/order-status";
import { formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/cn";

const DOT: Record<OrderStatus, string> = {
  pending: "bg-ink-3",
  with_courier: "bg-carbon",
  exchanged: "bg-late",
  delivered: "bg-ok",
  returned: "bg-late",
  refused: "bg-stamp",
};

interface Event {
  status: OrderStatus;
  at: string;
  by?: { email?: string; role?: string };
  reason?: string | null;
}

// Status history, newest last. `showWho` adds who made each change (staff only).
export default function StatusTimeline({ events = [], showWho = false }: { events?: Event[]; showWho?: boolean }) {
  if (!events.length) return <p className="text-sm text-ink-3">لا يوجد سجل حالات بعد.</p>;
  return (
    <ol className="relative space-y-4 ps-5 before:absolute before:inset-y-1.5 before:start-[5px] before:w-px before:bg-rule">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span className={cn("absolute -start-5 top-1.5 size-[11px] rounded-full ring-4 ring-sheet", DOT[e.status])} aria-hidden />
          <p className={cn("text-sm font-medium", i === events.length - 1 ? "text-ink" : "text-ink-2")}>{statusLabel(e.status)}</p>
          <p className="num text-xs text-ink-3">
            {formatDateTime(e.at)}
            {showWho && e.by?.email ? ` — ${e.by.email}` : showWho && e.by?.role === "merchant_api" ? " — عبر الربط مع التاجر" : ""}
          </p>
          {e.reason && <p className="mt-1 text-sm text-ink-2">السبب: {e.reason}</p>}
        </li>
      ))}
    </ol>
  );
}
