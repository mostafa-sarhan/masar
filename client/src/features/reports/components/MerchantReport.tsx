import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { getMerchantReport } from "@/lib/resources-api";
import FeeInputs, { type FeeValues } from "./FeeInputs";
import { Panel } from "@/components/ui/Panel";
import { DataTable } from "@/components/ui/DataTable";
import { DateRange, type Range } from "@/components/ui/DateRange";
import Money from "@/components/ui/Money";
import { useFeedback } from "@/components/ui/feedback-context";
import { useDebounced } from "@/lib/use-debounced";
import { errorMessage } from "@/lib/errors";
import type { GroupedReportRow, ReportMeta } from "@/lib/types";

type Row = GroupedReportRow<"merchant">;

// Orders and money per merchant (server formula, fee snapshots).
export default function MerchantReport() {
  const { toast } = useFeedback();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [range, setRange] = useState<Range>({ from: "", to: "" });
  const [fees, setFees] = useState<FeeValues>({ courierFee: "", companyFee: "" });
  const [defaults, setDefaults] = useState<ReportMeta["fees"] | null>(null);
  const debouncedFees = useDebounced(fees);

  useEffect(() => {
    let cancelled = false;
    getMerchantReport({ archived: "all", ...range, ...debouncedFees })
      .then(({ data, meta }) => {
        if (cancelled) return;
        setRows(data.filter((r) => r.merchant));
        setDefaults(meta.fees);
      })
      .catch((err) => toast(errorMessage(err), "danger"));
    return () => {
      cancelled = true;
    };
  }, [range, debouncedFees, toast]);

  return (
    <div className="space-y-5">
      <Panel bodyClassName="flex flex-wrap items-center gap-3">
        <DateRange value={range} onChange={setRange} />
        <FeeInputs value={fees} onChange={setFees} defaults={defaults} showCourier={false} />
      </Panel>
      <Panel>
        <DataTable
          caption="تقرير التجار"
          loading={!rows}
          rows={rows ?? []}
          rowKey={(r) => r.merchant!._id}
          columns={[
            { key: "name", header: "التاجر", primary: true, cell: (r) => <span className="font-medium text-ink">{r.merchant!.name}</span> },
            { key: "total", header: "الشحنات", cell: (r) => <span className="num">{r.total.count}</span> },
            { key: "delivered", header: "تم التسليم", cell: (r) => <span className="num text-ok">{r.byStatus.delivered?.count ?? 0}</span> },
            { key: "returned", header: "مرتجع ومرفوض", cell: (r) => <span className="num text-stamp">{(r.byStatus.returned?.count ?? 0) + (r.byStatus.refused?.count ?? 0)}</span> },
            { key: "open", header: "مفتوحة", hideOnMobile: true, cell: (r) => <span className="num text-ink-2">{(r.byStatus.pending?.count ?? 0) + (r.byStatus.with_courier?.count ?? 0) + (r.byStatus.exchanged?.count ?? 0)}</span> },
            { key: "deliveredTotal", header: "قيمة المسلّم", align: "end", cell: (r) => <Money value={r.money.deliveredTotal} /> },
            { key: "company", header: "عمولة الشركة", align: "end", cell: (r) => <Money value={r.money.companyCommission} /> },
            { key: "net", header: "صافي التاجر", align: "end", cell: (r) => <b className="text-ink"><Money value={r.money.merchantNet} /></b> },
          ]}
          empty={{ icon: <Store />, title: "لا توجد بيانات في هذه الفترة" }}
        />
      </Panel>
    </div>
  );
}
