import type { ReactNode } from "react";
import type { OrderStatus } from "@masar/shared";
import { statusLabel } from "@/lib/order-status";
import { cn } from "@/lib/cn";

// Open statuses are calm pills; outcomes are rubber stamps, like on a paper waybill.
const PILL: Partial<Record<OrderStatus, string>> = {
  pending: "bg-sheet-2 text-ink-2 border border-rule",
  with_courier: "bg-carbon-soft text-carbon",
  exchanged: "bg-late-soft text-late",
};
const STAMP: Partial<Record<OrderStatus, string>> = {
  delivered: "text-ok",
  returned: "text-late",
  refused: "text-stamp",
};

export function StatusBadge({ status, pressed, className }: { status: OrderStatus; pressed?: boolean; className?: string }) {
  if (STAMP[status]) {
    return <span className={cn("stamp text-xs", STAMP[status], pressed && "stamp-press", className)}>{statusLabel(status)}</span>;
  }
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", PILL[status], className)}>{statusLabel(status)}</span>;
}

type Tone = "neutral" | "info" | "ok" | "warn" | "danger";
const TONES: Record<Tone, string> = {
  neutral: "bg-sheet-2 text-ink-2 border border-rule",
  info: "bg-carbon-soft text-carbon",
  ok: "bg-ok-soft text-ok",
  warn: "bg-late-soft text-late",
  danger: "bg-stamp-soft text-stamp",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", TONES[tone], className)}>{children}</span>;
}
