import type { ReactNode } from "react";
import Money from "@/components/ui/Money";
import { cn } from "@/lib/cn";

// Labelled amounts; the `strong` one is the figure the reader came for.
export function MoneyTiles({ items }: { items: { label: string; value: number; strong?: boolean; hint?: ReactNode }[] }) {
  return (
    // Tiles wrap and stretch, so any count fills its rows without empty cells.
    <dl className="flex flex-wrap gap-px overflow-hidden rounded-lg border border-rule bg-rule">
      {items.map((t) => (
        <div key={t.label} className={cn("min-w-36 flex-1 basis-36 bg-sheet px-4 py-3", t.strong && "bg-carbon-soft")}>
          <dt className="text-xs text-ink-2">{t.label}</dt>
          <dd className={cn("num mt-0.5 font-semibold", t.strong ? "text-lg text-carbon" : "text-md text-ink")}>
            <Money value={t.value} />
          </dd>
          {t.hint && <p className="mt-0.5 text-2xs text-ink-3">{t.hint}</p>}
        </div>
      ))}
    </dl>
  );
}
