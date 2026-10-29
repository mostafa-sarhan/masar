import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackagePlus, FileSpreadsheet, Inbox } from "lucide-react";
import type { DashboardOverview } from "@masar/shared";
import { getDashboard } from "../api/dashboard-api";
import { WeekBars } from "../components/WeekBars";
import { getMerchantReport } from "@/lib/resources-api";
import { useAuth } from "@/app/auth-context";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Status";
import { Skeleton, EmptyState, Notice } from "@/components/ui/Feedback";
import Money from "@/components/ui/Money";
import { displayTimezone, LOCALE } from "@/lib/locale";
import { errorMessage } from "@/lib/errors";
import { isAdmin as isAdminRole } from "@/lib/roles";
import { formatDateTime } from "@/lib/format-date";

const greeting = () => {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: displayTimezone() }).format(new Date()));
  return hour < 12 ? "صباح الخير" : "مساء الخير";
};
const longDate = () => new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", timeZone: displayTimezone() }).format(new Date());

export default function DashboardPage() {
  const { user } = useAuth();
  const admin = isAdminRole(user?.role);
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [owed, setOwed] = useState<{ name: string; net: number }[] | null>(null);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    getDashboard()
      .then((d) => {
        setData(d);
        setUpdatedAt(new Date());
      })
      .catch((err) => setError(errorMessage(err)));
    if (admin) {
      getMerchantReport({ archived: "false" })
        .then(({ data: rows }) =>
          setOwed(
            rows
              .filter((r) => r.merchant && r.money.merchantNet > 0)
              .sort((a, b) => b.money.merchantNet - a.money.merchantNet)
              .slice(0, 4)
              .map((r) => ({ name: r.merchant!.name ?? "", net: r.money.merchantNet }))
          )
        )
        .catch(() => setOwed([]));
    }
  }, [admin]);

  const counts = data && [
    { label: "في المخزن، تنتظر مندوبًا", value: data.counts.pending },
    { label: "مع المناديب الآن", value: data.counts.with_courier },
    { label: "سُلّمت اليوم", value: data.today.delivered },
    { label: "مرتجع أو مرفوض اليوم", value: data.today.returned + data.today.refused, alert: true },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {greeting()}
          </h1>
          <p className="mt-0.5 text-sm text-ink-2">{longDate()}</p>
        </div>
        <div className="flex gap-2">
          {admin && (
            <Link to="/import">
              <Button variant="secondary" icon={<FileSpreadsheet className="size-4" />}>
                استيراد ملف
              </Button>
            </Link>
          )}
          <Link to="/orders/new">
            <Button icon={<PackagePlus className="size-4" />}>شحنة جديدة</Button>
          </Link>
        </div>
      </div>

      {error && <Notice tone="danger">{error}</Notice>}

      {/* Today's manifest */}
      <section className="manifest px-5 pb-4 pt-6 shadow-1 sm:px-7" aria-label="بيان اليوم">
        <div className="flex items-center justify-between border-b border-dashed border-rule pb-3">
          <h2 className="font-semibold text-ink">بيان اليوم</h2>
          <span className="num text-xs text-ink-3">{updatedAt ? `آخر تحديث ${updatedAt.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit", timeZone: displayTimezone() })}` : " "}</span>
        </div>
        <dl className="grid grid-cols-2 lg:grid-cols-4">
          {(counts ?? Array.from({ length: 4 }, () => null)).map((c, i) => (
            <div key={i} className="border-rule py-4 ps-0 pe-4 odd:border-e lg:border-e lg:last:border-e-0 lg:ps-5 lg:first:ps-0">
              {c ? (
                <>
                  <dd className={`num text-3xl font-semibold leading-tight ${c.alert && c.value ? "text-stamp" : "text-ink"}`}>{c.value}</dd>
                  <dt className="mt-0.5 text-sm text-ink-2">{c.label}</dt>
                </>
              ) : (
                <>
                  <Skeleton className="h-10 w-16" />
                  <Skeleton className="mt-2 h-4 w-28" />
                </>
              )}
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Panel title="المناديب على الطريق" action={<Link to="/orders/courier-batch" className="text-sm text-carbon hover:underline">تسوية المناديب</Link>}>
          {!data ? (
            <div className="space-y-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-5" />)}</div>
          ) : data.couriers.length === 0 ? (
            <EmptyState title="لا يوجد مندوب على الطريق" description="سلّم الشحنات للمناديب من صفحة التسليم." action={<Link to="/orders/assign"><Button variant="secondary">تسليم للمناديب</Button></Link>} />
          ) : (
            <ul className="divide-y divide-rule-soft">
              {data.couriers.map((c) => {
                const total = c.open + c.closedToday;
                const pct = total ? Math.round((c.closedToday / total) * 100) : 0;
                return (
                  <li key={c._id} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 py-2.5 sm:grid-cols-[8.5rem_1fr_5.5rem]">
                    <span className="truncate font-medium text-ink">{c.name ?? "—"}</span>
                    <div className="h-2.5 rounded-full bg-[repeating-linear-gradient(90deg,var(--c-rule-soft)_0_6px,transparent_6px_10px)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.name}: ${c.closedToday} من ${total}`}>
                      <div className="h-full rounded-full bg-carbon" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="num text-end text-sm text-ink-2">
                      {c.closedToday} من {total}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-4 flex items-baseline justify-between rounded-md border border-dashed border-rule bg-sheet-2 px-4 py-3">
            <span className="text-sm text-ink-2">نقدية محصّلة اليوم من التسليمات</span>
            <b className="num text-xl text-ink">{data ? <Money value={data.today.cash} /> : <Skeleton className="h-6 w-24" />}</b>
          </div>
        </Panel>

        <Panel title="تحتاج متابعة" action={<Link to="/orders?status=refused" className="text-sm text-carbon hover:underline">كل المرفوضات</Link>}>
          {!data ? (
            <div className="space-y-4">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : data.attention.length === 0 ? (
            <EmptyState icon={<Inbox />} title="لا شيء يحتاج متابعة" description="لا مرتجعات أو مرفوضات منذ أمس، ولا شحنات متأخرة." />
          ) : (
            <ul className="divide-y divide-rule-soft">
              {data.attention.map((o) => (
                <li key={o._id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      <span className="num">{o.barcode}</span> <span className="text-ink-2">{o.fullName}</span>
                    </p>
                    <p className="mt-0.5 truncate text-sm text-ink-3">
                      {o.address}
                      {o.reason ? `: "${o.reason}"` : o.late && o.courier ? `، مع ${o.courier.name} منذ ${formatDateTime(o.updatedAt)}` : ""}
                    </p>
                  </div>
                  {o.late ? <span className="stamp text-xs text-late">متأخرة</span> : <StatusBadge status={o.status} />}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="التسليمات هذا الأسبوع">{data ? <WeekBars week={data.week} /> : <Skeleton className="h-40" />}</Panel>

        {admin && (
          <Panel title="مستحقات التجار" action={<Link to="/reports?tab=merchants" className="text-sm text-carbon hover:underline">التقارير</Link>}>
            {!owed ? (
              <div className="space-y-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-6" />)}</div>
            ) : owed.length === 0 ? (
              <EmptyState title="لا مستحقات مفتوحة" description="تظهر هنا صافي مستحقات التجار عن الشحنات المسلّمة." />
            ) : (
              <ul className="divide-y divide-rule-soft">
                {owed.map((m) => (
                  <li key={m.name} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-ink">{m.name}</span>
                    <b className="num text-ink">
                      <Money value={m.net} />
                    </b>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}
