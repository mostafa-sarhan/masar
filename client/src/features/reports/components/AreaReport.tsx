import { useEffect, useState } from "react";
import { MapPinned } from "lucide-react";
import { getGovernorateReport, getZoneReport } from "@/lib/resources-api";
import { Panel } from "@/components/ui/Panel";
import { DataTable } from "@/components/ui/DataTable";
import { DateRange, type Range } from "@/components/ui/DateRange";
import Money from "@/components/ui/Money";
import { useFeedback } from "@/components/ui/feedback-context";
import { errorMessage } from "@/lib/errors";
import type { GroupedReportRow } from "@/lib/types";

type Field = "zone" | "governorate";
type Row = GroupedReportRow<Field>;

const LOADERS = { zone: getZoneReport, governorate: getGovernorateReport };
const LABELS: Record<Field, { title: string; none: string }> = {
  zone: { title: "منطقة الشحن", none: "خارج المناطق" },
  governorate: { title: "المحافظة", none: "بدون محافظة" },
};

// Orders, delivery rate and shipping revenue per zone or per governorate.
export default function AreaReport({ field }: { field: Field }) {
  const { toast } = useFeedback();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [range, setRange] = useState<Range>({ from: "", to: "" });

  useEffect(() => {
    let cancelled = false;
    LOADERS[field]({ archived: "all", ...range })
      .then(({ data }) => !cancelled && setRows(data as Row[]))
      .catch((err) => toast(errorMessage(err), "danger"));
    return () => {
      cancelled = true;
    };
  }, [field, range, toast]);

  const ref = (r: Row) => (r as Record<Field, { _id: string; name: string | null } | null>)[field];
  const rate = (r: Row) => {
    const closed = (r.byStatus.delivered?.count ?? 0) + (r.byStatus.returned?.count ?? 0) + (r.byStatus.refused?.count ?? 0);
    return closed ? Math.round(((r.byStatus.delivered?.count ?? 0) / closed) * 100) : null;
  };

  return (
    <div className="space-y-5">
      <Panel bodyClassName="flex flex-wrap items-center gap-3">
        <DateRange value={range} onChange={setRange} />
      </Panel>
      <Panel>
        <DataTable
          caption={`تقرير حسب ${LABELS[field].title}`}
          loading={!rows}
          rows={rows ?? []}
          rowKey={(r) => ref(r)?._id ?? "none"}
          columns={[
            { key: "name", header: LABELS[field].title, primary: true, cell: (r) => <span className="font-medium text-ink">{ref(r)?.name ?? LABELS[field].none}</span> },
            { key: "total", header: "الشحنات", cell: (r) => <span className="num">{r.total.count}</span> },
            { key: "delivered", header: "تم التسليم", cell: (r) => <span className="num text-ok">{r.byStatus.delivered?.count ?? 0}</span> },
            { key: "returned", header: "مرتجع ومرفوض", cell: (r) => <span className="num text-stamp">{(r.byStatus.returned?.count ?? 0) + (r.byStatus.refused?.count ?? 0)}</span> },
            { key: "rate", header: "نسبة التسليم", cell: (r) => <span className="num text-ink-2">{rate(r) === null ? "—" : `${rate(r)}%`}</span> },
            { key: "deliveredTotal", header: "قيمة المسلّم", align: "end", hideOnMobile: true, cell: (r) => <Money value={r.money.deliveredTotal} /> },
            { key: "shipping", header: "إيراد الشحن", align: "end", cell: (r) => <b className="text-ink"><Money value={r.money.companyCommission} /></b> },
          ]}
          empty={{ icon: <MapPinned />, title: "لا توجد بيانات في هذه الفترة" }}
        />
      </Panel>
    </div>
  );
}
