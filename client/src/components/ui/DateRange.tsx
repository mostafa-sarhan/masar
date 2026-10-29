import { displayTimezone } from "@/lib/locale";
import { Input } from "./Field";
import { cn } from "@/lib/cn";

export type Range = {
  from: string;
  to: string;
}

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: displayTimezone() }).format(new Date());
const shift = (day: string, days: number) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

// Days are in the company's timezone (the server uses the same).
const PRESETS: { label: string; range: () => Range }[] = [
  { label: "اليوم", range: () => ({ from: today(), to: today() }) },
  { label: "أمس", range: () => ({ from: shift(today(), -1), to: shift(today(), -1) }) },
  { label: "آخر 7 أيام", range: () => ({ from: shift(today(), -6), to: today() }) },
  { label: "هذا الشهر", range: () => ({ from: `${today().slice(0, 8)}01`, to: today() }) },
];

// From/to date inputs with quick presets. Empty = no limit.
export function DateRange({ value, onChange, className }: { value: Range; onChange(range: Range): void; className?: string }) {
  const active = PRESETS.find((p) => {
    const r = p.range();
    return r.from === value.from && r.to === value.to;
  });
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex w-full items-center gap-1.5 sm:w-auto">
        <Input type="date" aria-label="من تاريخ" className="min-w-0 flex-1 sm:w-[9.5rem] sm:flex-none" value={value.from} max={value.to || undefined} onChange={(e) => onChange({ ...value, from: e.target.value })} />
        <span className="text-ink-3 text-sm">إلى</span>
        <Input type="date" aria-label="إلى تاريخ" className="min-w-0 flex-1 sm:w-[9.5rem] sm:flex-none" value={value.to} min={value.from || undefined} onChange={(e) => onChange({ ...value, to: e.target.value })} />
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label="فترات جاهزة">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.range())}
            className={cn("h-8 rounded-md px-2.5 text-xs transition-colors cursor-pointer", active === p ? "bg-carbon-soft text-carbon font-medium" : "text-ink-2 hover:bg-sheet-2")}
          >
            {p.label}
          </button>
        ))}
        {(value.from || value.to) && (
          <button type="button" onClick={() => onChange({ from: "", to: "" })} className="h-8 rounded-md px-2.5 text-xs text-ink-3 hover:bg-sheet-2 cursor-pointer">
            كل الفترات
          </button>
        )}
      </div>
    </div>
  );
}
