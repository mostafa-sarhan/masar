import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4", className)} aria-hidden />;
}

// Placeholder rows while a list loads (fixed height: no layout shift).
export function SkeletonRows({ rows = 6, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} role="status" aria-label="جارٍ التحميل">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-12 text-center", className)}>
      {icon && <div className="mb-1 text-ink-3 [&_svg]:size-8">{icon}</div>}
      <p className="text-md font-medium text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-2">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "info", children, className }: { tone?: "info" | "warn" | "danger" | "ok"; children: ReactNode; className?: string }) {
  const tones = { info: "bg-carbon-soft text-carbon", warn: "bg-late-soft text-late", danger: "bg-stamp-soft text-stamp", ok: "bg-ok-soft text-ok" };
  return <div className={cn("rounded-md px-4 py-3 text-sm", tones[tone], className)}>{children}</div>;
}
