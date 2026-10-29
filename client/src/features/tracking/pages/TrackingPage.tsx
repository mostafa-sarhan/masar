import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PackageSearch, Search } from "lucide-react";
import { isFinal } from "@masar/shared";
import { trackShipment } from "@/features/orders/api/orders-api";
import StatusTimeline from "@/features/orders/components/StatusTimeline";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/Status";
import { EmptyState, Notice, Skeleton } from "@/components/ui/Feedback";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format-date";
import { ApiError } from "@/lib/api-client";
import type { TrackingResult } from "@/lib/types";

// Public page for customers: /track/:trackingId. The status timeline only, never phone or address.
export default function TrackingPage() {
  const { trackingId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(trackingId || "");
  // Keyed by the id it belongs to, so a new id shows the skeleton until its answer arrives.
  const [answer, setAnswer] = useState<{ id: string; result: TrackingResult | null; error: string } | null>(null);
  const current = trackingId && answer?.id === trackingId ? answer : null;
  const loading = !!trackingId && !current;
  const result = current?.result ?? null;
  const error = current?.error ?? "";

  useEffect(() => {
    if (!trackingId) return;
    let cancelled = false;
    trackShipment(trackingId)
      .then((data) => !cancelled && setAnswer({ id: trackingId, result: data, error: "" }))
      .catch((err) => {
        if (cancelled) return;
        const error = err instanceof ApiError && err.code === "NOT_FOUND" ? "لا توجد شحنة بهذا الرقم. تأكد من الرابط أو الرقم المرسل إليك." : errorMessage(err);
        setAnswer({ id: trackingId, result: null, error });
      });
    return () => {
      cancelled = true;
    };
  }, [trackingId]);

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-xl items-center justify-between px-4">
        {result ? (
          <div className="flex items-center gap-2.5">
            {result.company.logoUrl && <img src={result.company.logoUrl} alt="" width={36} height={36} className="size-9 rounded-md object-contain" />}
            <span className="font-semibold text-ink">{result.company.name}</span>
          </div>
        ) : (
          <Link to="/welcome" className="text-ink"><Logo /></Link>
        )}
        <ThemeToggle className="text-ink-2" />
      </header>

      <main className="mx-auto max-w-xl px-4 pb-16 pt-4">
        <h1 className="text-2xl font-semibold text-ink">تتبع شحنتك</h1>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) navigate(`/track/${input.trim().toUpperCase()}`);
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
            <Input className="ps-9" value={input} onChange={(e) => setInput(e.target.value)} placeholder="رقم التتبع" aria-label="رقم التتبع" dir="ltr" autoComplete="off" />
          </div>
          <Button type="submit">تتبع</Button>
        </form>

        <div className="mt-6">
          {loading ? (
            <Skeleton className="h-72" />
          ) : error ? (
            <Notice tone="danger">{error}</Notice>
          ) : result ? (
            <article className="manifest relative px-6 pb-6 pt-8">
              <div className="flex items-start justify-between gap-4 border-b border-dashed border-rule pb-4">
                <div className="min-w-0">
                  <p className="text-sm text-ink-2">رقم التتبع</p>
                  <p dir="ltr" className="num break-all text-start text-lg font-semibold text-ink">{result.trackingId}</p>
                  <p className="mt-1 text-xs text-ink-3">آخر تحديث {formatDateTime(result.updatedAt)}</p>
                </div>
                <StatusBadge status={result.status} pressed={isFinal(result.status)} className={isFinal(result.status) ? "shrink-0 text-base" : "shrink-0"} />
              </div>
              <div className="pt-5">
                <StatusTimeline events={result.timeline} />
              </div>
            </article>
          ) : (
            <EmptyState icon={<PackageSearch />} title="أدخل رقم التتبع" description="تجده في الرسالة التي وصلتك من المتجر أو شركة الشحن." />
          )}
        </div>
        <p className="mt-10 text-center text-xs text-ink-3">
          يعمل بنظام <Link to="/welcome" className="underline underline-offset-2 hover:text-ink">مسار</Link>
        </p>
      </main>
    </div>
  );
}
