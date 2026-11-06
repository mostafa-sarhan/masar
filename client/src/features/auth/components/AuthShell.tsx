import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// Two-column frame for sign-in screens: the form on a sheet, and a navy manifest panel.
// `banner` (e.g. the demo notice) spans the top.
export function AuthShell({ title, description, children, aside, banner }: { title: string; description?: ReactNode; children: ReactNode; aside?: ReactNode; banner?: ReactNode }) {
  return (
    <>
      {banner}
      <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
        <div className="flex flex-col px-5 py-6 sm:px-10">
          <div className="flex items-center justify-between">
            <Link to="/welcome" className="text-ink">
              <Logo />
            </Link>
            <ThemeToggle className="text-ink-2" />
          </div>
          <div className="m-auto w-full max-w-sm py-10">
            <h1 className="text-2xl font-semibold text-ink">{title}</h1>
            {description && <p className="mt-1.5 text-sm text-ink-2">{description}</p>}
            <div className="mt-7">{children}</div>
          </div>
        </div>
        <div className="relative hidden overflow-hidden bg-rail p-10 text-rail-ink lg:flex lg:flex-col lg:justify-end">{aside ?? <ManifestAside />}</div>
      </div>
    </>
  );
}

// A sample of the day's manifest, as the product's signature.
function ManifestAside() {
  const rows = [
    ["48213907", "التجمع الخامس", "delivered"],
    ["48213412", "مدينة نصر", "returned"],
    ["48209877", "الهرم", "with_courier"],
    ["48201155", "المعادي", "delivered"],
  ] as const;
  return (
    <div className="max-w-md">
      <div className="manifest bg-sheet px-6 pb-5 pt-7 text-ink shadow-3 [background-color:var(--c-sheet)]">
        <div className="flex items-center justify-between border-b border-dashed border-rule pb-3 text-sm">
          <b>بيان اليوم</b>
          <span className="num text-ink-3">29/10</span>
        </div>
        <ul className="divide-y divide-rule-soft text-sm">
          {rows.map(([code, area, status]) => (
            <li key={code} className="flex items-center justify-between py-2.5">
              <span>
                <span className="num font-medium">{code}</span> <span className="text-ink-2">{area}</span>
              </span>
              {status === "delivered" && <span className="stamp text-2xs text-ok">تم التسليم</span>}
              {status === "returned" && <span className="stamp text-2xs text-late">مرتجع</span>}
              {status === "with_courier" && <span className="rounded-full bg-carbon-soft px-2 py-0.5 text-2xs text-carbon">مع المندوب</span>}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-8 text-lg leading-relaxed text-white">كل شحنة في مكانها: من المخزن إلى المندوب إلى العميل، والتسوية محسوبة.</p>
    </div>
  );
}
