import { displayTimezone, LOCALE } from "@/lib/locale";

const dayName = (day: string) => new Intl.DateTimeFormat(LOCALE, { weekday: "short", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));

// Deliveries per day, oldest first (right to left in Arabic). Today is highlighted.
export function WeekBars({ week }: { week: { day: string; delivered: number }[] }) {
  const max = Math.max(1, ...week.map((d) => d.delivered));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: displayTimezone() }).format(new Date());
  return (
    <figure>
      <div className="flex h-36 items-end gap-2 sm:gap-3" role="img" aria-label={`التسليمات خلال 7 أيام: ${week.map((d) => d.delivered).join("، ")}`}>
        {week.map((d) => (
          <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="num text-2xs text-ink-2">{d.delivered || ""}</span>
            <div
              className={d.day === today ? "w-full rounded-t-sm bg-carbon" : "w-full rounded-t-sm bg-ink/80 dark:bg-ink-3"}
              style={{ height: `${Math.max(d.delivered ? 6 : 2, (d.delivered / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3">
        {week.map((d) => (
          <span key={d.day} className={`flex-1 text-center text-2xs ${d.day === today ? "font-semibold text-ink" : "text-ink-3"}`}>
            {d.day === today ? "اليوم" : dayName(d.day)}
          </span>
        ))}
      </div>
    </figure>
  );
}
