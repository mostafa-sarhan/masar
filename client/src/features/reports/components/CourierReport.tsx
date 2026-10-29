import { useEffect, useState } from "react";
import { Bike } from "lucide-react";
import { getCourierReport } from "@/lib/resources-api";
import FeeInputs, { type FeeValues } from "./FeeInputs";
import { Panel } from "@/components/ui/Panel";
import { DataTable } from "@/components/ui/DataTable";
import { DateRange, type Range } from "@/components/ui/DateRange";
import Money from "@/components/ui/Money";
import { useFeedback } from "@/components/ui/feedback-context";
import { useDebounced } from "@/lib/use-debounced";
import { errorMessage } from "@/lib/errors";
import type { GroupedReportRow, ReportMeta } from "@/lib/types";

type Row = GroupedReportRow<"courier">;

// Results and commission per courier (the courier fee is an internal cost, shown only here).
export default function CourierReport() {
  const { toast } = useFeedback();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [range, setRange] = useState<Range>({ from: "", to: "" });
  const [fees, setFees] = useState<FeeValues>({ courierFee: "", companyFee: "" });
  const [defaults, setDefaults] = useState<ReportMeta["fees"] | null>(null);
  const debouncedFees = useDebounced(fees);

  useEffect(() => {
    let cancelled = false;
    getCourierReport({ archived: "all", ...range, ...debouncedFees })
      .then(({ data, meta }) => {
        if (cancelled) return;
        setRows(data.filter((r) => r.courier));
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
        <FeeInputs value={fees} onChange={setFees} defaults={defaults} showCompany={false} />
      </Panel>
      <Panel>
        <DataTable
          caption="تقرير المناديب"
          loading={!rows}
          rows={rows ?? []}
          rowKey={(r) => r.courier!._id}
          columns={[
            { key: "name", header: "المندوب", primary: true, cell: (r) => <span className="font-medium text-ink">{r.courier!.name}</span> },
            { key: "delivered", header: "تم التسليم", cell: (r) => <span className="num text-ok">{r.byStatus.delivered?.count ?? 0}</span> },
            { key: "returned", header: "مرتجع", cell: (r) => <span className="num text-late">{r.byStatus.returned?.count ?? 0}</span> },
            { key: "refused", header: "مرفوض", cell: (r) => <span className="num text-stamp">{r.byStatus.refused?.count ?? 0}</span> },
            { key: "open", header: "معه الآن", cell: (r) => <span className="num text-ink-2">{r.byStatus.with_courier?.count ?? 0}</span> },
            { key: "cash", header: "نقدية المسلّم", align: "end", cell: (r) => <Money value={r.money.deliveredTotal} /> },
            { key: "commission", header: "عمولة المندوب", align: "end", cell: (r) => <b className="text-ink"><Money value={r.money.courierCommission} /></b> },
          ]}
          empty={{ icon: <Bike />, title: "لا توجد بيانات في هذه الفترة" }}
        />
      </Panel>
    </div>
  );
}
