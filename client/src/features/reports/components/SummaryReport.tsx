import { useState } from "react";
import { FileDown } from "lucide-react";
import { exportOrders } from "@/features/orders/api/orders-api";
import { useSummaryReport } from "../hooks/use-summary-report";
import FeeInputs, { type FeeValues } from "./FeeInputs";
import { MoneyTiles } from "./MoneyTiles";
import { downloadReport } from "../lib/excel";
import MerchantSelect from "@/features/merchants/components/MerchantSelect";
import { Panel } from "@/components/ui/Panel";
import { DateRange, type Range } from "@/components/ui/DateRange";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Feedback";
import Money from "@/components/ui/Money";
import { useFeedback } from "@/components/ui/feedback-context";
import { useDebounced } from "@/lib/use-debounced";
import { ORDER_STATUSES, statusLabel } from "@/lib/order-status";
import { errorMessage } from "@/lib/errors";

// Totals by status and the settlement for one merchant (or all) over a period.
export default function SummaryReport() {
  const { toast } = useFeedback();
  const [merchant, setMerchant] = useState("");
  const [range, setRange] = useState<Range>({ from: "", to: "" });
  const [fees, setFees] = useState<FeeValues>({ courierFee: "", companyFee: "" });
  const debouncedFees = useDebounced(fees);
  const filters = { archived: "all", merchant, ...range };
  const { report, fees: used, loading } = useSummaryReport({ ...filters, ...debouncedFees });

  const exportExcel = async () => {
    if (!report || !used) return;
    try {
      const { data, meta } = await exportOrders(filters);
      if (meta.truncated) toast(`الملف يحتوي على أول ${data.length} من ${meta.total} شحنة`, "info");
      const m = report.money;
      await downloadReport({
        fileName: `كشف_حساب_${merchant ? data[0]?.merchant?.name ?? "تاجر" : "كل_التجار"}`,
        sheetName: "كشف الحساب",
        summary: [
          ["من", range.from || "البداية", "", "إلى", range.to || "اليوم"],
          ["إجمالي الشحنات", report.total.count, "", "إجمالي المبالغ", report.total.amount],
          ["تم تسليمه", m.deliveredTotal, "", "عمولة الشركة", m.companyCommission],
          ["صافي التاجر", m.merchantNet, "", "عمولة المندوب", m.courierCommission],
          ...ORDER_STATUSES.map((s) => [statusLabel(s), report.byStatus[s]?.count ?? 0, "", "المبلغ", report.byStatus[s]?.amount ?? 0]),
        ],
        columns: [
          { header: "الباركود", value: (o) => o.barcode },
          { header: "العميل", value: (o) => o.fullName },
          { header: "المبلغ", value: (o) => o.cost },
          { header: "الحالة", value: (o) => statusLabel(o.status) },
          { header: "المندوب", value: (o) => o.courier?.name ?? "" },
          { header: "التاجر", value: (o) => o.merchant?.name ?? "" },
        ],
        rows: data,
      });
    } catch (err) {
      toast(errorMessage(err), "danger");
    }
  };

  return (
    <div className="space-y-5">
      <Panel bodyClassName="flex flex-wrap items-center gap-3">
        <MerchantSelect value={merchant} onChange={setMerchant} className="w-48" aria-label="التاجر" />
        <DateRange value={range} onChange={setRange} />
        <FeeInputs value={fees} onChange={setFees} defaults={used} />
        <Button variant="secondary" className="ms-auto" icon={<FileDown className="size-4" />} onClick={exportExcel} disabled={!report}>
          تصدير Excel
        </Button>
      </Panel>

      {loading || !report ? (
        <Skeleton className="h-40" />
      ) : (
        <>
          <MoneyTiles
            items={[
              { label: "إجمالي ما سُلّم", value: report.money.deliveredTotal },
              { label: "عمولة المندوب", value: report.money.courierCommission, hint: "تكلفة داخلية" },
              { label: "بعد عمولة المندوب", value: report.money.afterCourier },
              { label: "عمولة الشركة", value: report.money.companyCommission },
              { label: "صافي مستحقات التاجر", value: report.money.merchantNet, strong: true },
            ]}
          />
          <Panel title="حسب الحالة">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {ORDER_STATUSES.map((s) => (
                <div key={s}>
                  <dt className="text-xs text-ink-2">{statusLabel(s)}</dt>
                  <dd className="num text-xl font-semibold text-ink">{report.byStatus[s]?.count ?? 0}</dd>
                  <dd className="text-xs text-ink-3"><Money value={report.byStatus[s]?.amount ?? 0} /></dd>
                </div>
              ))}
            </dl>
          </Panel>
        </>
      )}
    </div>
  );
}
