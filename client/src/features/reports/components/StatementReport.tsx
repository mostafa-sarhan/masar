import { useState } from "react";
import { FileDown, ReceiptText } from "lucide-react";
import { exportOrders } from "@/features/orders/api/orders-api";
import { usePagedOrders } from "@/features/orders/hooks/use-paged-orders";
import { orderColumns } from "@/features/orders/components/order-columns";
import { useSummaryReport } from "../hooks/use-summary-report";
import FeeInputs, { type FeeValues } from "./FeeInputs";
import { MoneyTiles } from "./MoneyTiles";
import { downloadReport } from "../lib/excel";
import CourierSelect from "@/features/couriers/components/CourierSelect";
import MerchantSelect from "@/features/merchants/components/MerchantSelect";
import { Panel } from "@/components/ui/Panel";
import { DataTable } from "@/components/ui/DataTable";
import { DateRange, type Range } from "@/components/ui/DateRange";
import StatusSelect from "@/features/orders/components/StatusSelect";
import { GovernorateSelect } from "@/features/locations/components/PlaceSelects";
import ZoneSelect from "@/features/zones/components/ZoneSelect";
import { Button } from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import Money from "@/components/ui/Money";
import { useFeedback } from "@/components/ui/feedback-context";
import { useDebounced } from "@/lib/use-debounced";
import { statusLabel } from "@/lib/order-status";
import { placeLabel } from "@masar/shared";
import { errorMessage } from "@/lib/errors";
import type { Order } from "@/lib/types";

const PAGE_SIZE = 25;

// Detailed statement by courier, status, merchant and period. Totals come from the server.
export default function StatementReport() {
  const { toast } = useFeedback();
  const [courier, setCourier] = useState("");
  const [status, setStatus] = useState("");
  const [merchant, setMerchant] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [zone, setZone] = useState("");
  const [range, setRange] = useState<Range>({ from: "", to: "" });
  const [fees, setFees] = useState<FeeValues>({ courierFee: "", companyFee: "" });
  const [page, setPage] = useState(1);
  const debouncedFees = useDebounced(fees);
  const query = { archived: "all", courier, status, merchant, governorate, zone, ...range };
  const { report, fees: used } = useSummaryReport({ ...query, ...debouncedFees });
  const { items, pages, loading } = usePagedOrders({ ...query, page, limit: PAGE_SIZE });
  const commission = (o: Order) => (o.status === "delivered" ? (fees.courierFee !== "" ? Number(fees.courierFee) : o.fees?.courier ?? 0) : 0);

  const set = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const exportExcel = async () => {
    if (!report) return;
    try {
      const { data, meta } = await exportOrders(query);
      if (meta.truncated) toast(`الملف يحتوي على أول ${data.length} من ${meta.total} شحنة`, "info");
      const m = report.money;
      await downloadReport({
        fileName: "كشف_الحساب",
        sheetName: "كشف الحساب",
        summary: [
          ["من", range.from || "البداية", "", "إلى", range.to || "اليوم"],
          ["إجمالي المبالغ", report.total.amount, "", "تم تسليمه", m.deliveredTotal],
          ["عمولة المندوب", m.courierCommission, "", "بعد عمولة المندوب", m.afterCourier],
          ["عمولة الشركة", m.companyCommission, "", "صافي التاجر", m.merchantNet],
        ],
        columns: [
          { header: "الباركود", value: (o) => o.barcode },
          { header: "العميل", value: (o) => o.fullName },
          { header: "الهاتف", value: (o) => o.phone },
          { header: "الوجهة", value: (o) => placeLabel(o.governorate, o.city) },
          { header: "العنوان", value: (o) => o.address },
          { header: "سعر الشحن", value: (o) => o.shippingFee ?? "" },
          { header: "المبلغ", value: (o) => o.cost },
          { header: "الحالة", value: (o) => statusLabel(o.status) },
          { header: "المندوب", value: (o) => o.courier?.name ?? "" },
          { header: "التاجر", value: (o) => o.merchant?.name ?? "" },
          { header: "عمولة المندوب", value: commission },
        ],
        rows: data,
      });
    } catch (err) {
      toast(errorMessage(err), "danger");
    }
  };

  return (
    <div className="space-y-5">
      <Panel bodyClassName="space-y-3">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <CourierSelect value={courier} onChange={set(setCourier)} aria-label="المندوب" />
          <StatusSelect value={status} onChange={set(setStatus)} aria-label="الحالة" />
          <MerchantSelect value={merchant} onChange={set(setMerchant)} aria-label="التاجر" />
          <GovernorateSelect value={governorate} onChange={set(setGovernorate)} aria-label="المحافظة" />
          <ZoneSelect value={zone} onChange={set(setZone)} aria-label="منطقة الشحن" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateRange value={range} onChange={set(setRange)} />
          <FeeInputs value={fees} onChange={setFees} defaults={used} />
          <Button variant="secondary" className="ms-auto" icon={<FileDown className="size-4" />} onClick={exportExcel} disabled={!report}>
            تصدير Excel
          </Button>
        </div>
      </Panel>

      {report && (
        <MoneyTiles
          items={[
            { label: "إجمالي المبالغ", value: report.total.amount, hint: `${report.total.count} شحنة` },
            { label: "تم تسليمه", value: report.money.deliveredTotal },
            { label: "عمولة المندوب", value: report.money.courierCommission },
            { label: "عمولة الشركة", value: report.money.companyCommission },
            { label: "صافي التاجر", value: report.money.merchantNet, strong: true },
          ]}
        />
      )}

      <Panel>
        <DataTable
          caption="كشف الحساب"
          loading={loading}
          rows={items}
          rowKey={(o) => o._id}
          columns={[...orderColumns(["barcode", "customer", "address", "status", "courier", "merchant", "cost"]), { key: "commission", header: "عمولة المندوب", align: "end", cell: (o) => <Money value={commission(o)} /> }]}
          empty={{ icon: <ReceiptText />, title: "لا توجد شحنات تطابق الفلاتر" }}
        />
        <Pagination page={page} pages={pages} onChange={setPage} />
      </Panel>
    </div>
  );
}
