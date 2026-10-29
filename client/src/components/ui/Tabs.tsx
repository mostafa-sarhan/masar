import { cn } from "@/lib/cn";

// Underlined tabs; `value` is controlled by the page (often kept in the URL).
export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { value: T; label: string }[]; value: T; onChange(v: T): void; className?: string }) {
  return (
    <div role="tablist" className={cn("flex gap-1 overflow-x-auto border-b border-rule", className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={t.value === value}
          onClick={() => onChange(t.value)}
          className={cn(
            "relative h-10 px-4 text-sm whitespace-nowrap cursor-pointer transition-colors",
            t.value === value ? "text-ink font-semibold after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-carbon after:rounded-full" : "text-ink-2 hover:text-ink"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
