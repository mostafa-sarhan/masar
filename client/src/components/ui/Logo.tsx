import { cn } from "@/lib/cn";

// The Masar mark: a route line on customs-tape yellow.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 34 34" className={cn("size-8 shrink-0", className)} aria-hidden>
      <rect x="1" y="1" width="32" height="32" rx="7" fill="#F2C230" />
      <path d="M8 23 L14 11 L20 19 L26 9" fill="none" stroke="#1C2A4A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, subtitle }: { className?: string; subtitle?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <div className="leading-tight">
        <div className="text-lg font-bold">مسار</div>
        {subtitle && <div className="text-2xs opacity-80">{subtitle}</div>}
      </div>
    </div>
  );
}
