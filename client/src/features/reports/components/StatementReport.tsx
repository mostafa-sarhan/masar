import type { FeeValues } from "./FeeInputs";
import type { Order } from "@/lib/types";
import Money from "@/components/ui/Money";
import { useState } from "react";
import { exportOrders } from "@/features/orders/api/orders-api";
import { errorMessage } from "@/lib/errors";
import { useSummaryReport } from "@/features/reports/hooks/use-summary-report";
import { usePagedOrders } from "@/features/orders/hooks/use-paged-orders";
import CourierSelect from "@/features/couriers/components/CourierSelect";
import MerchantSelect from "@/features/merchants/components/MerchantSelect";
import FeeInputs from "./FeeInputs";
import Pagination from "@/components/ui/Pagination";
import { downloadReport } from "@/features/reports/lib/excel";
import { ORDER_STATUSES, statusLabel } from "@/lib/order-status";

const PAGE_SIZE = 25;

// Accounts statement by courier / status / company / dates. Totals come from the server;
// the table is paginated.
export default function Account() {
  const [filters, setFilters] = useState({ courier: "", status: "", merchant: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [feeInput, setFeeInput] = useState<FeeValues>({ courierFee: "", companyFee: "" });
  const [fees, setFees] = useState<FeeValues>(feeInput);
  const setFilter = (name: keyof typeof filters) => (value: string) => {
    setFilters((f) => ({ ...f, [name]: value }));
    setPage(1);
  };

  const query = { archived: "all", ...filters };
  const { report, fees: usedFees } = useSummaryReport({ ...query, ...fees });
  const { items } = usePagedOrders({ ...query, page, limit: PAGE_SIZE });
  const pages = report ? Math.ceil(report.total.count / PAGE_SIZE) : 0;
  const commission = (o: Order) => (o.status === "delivered" ? usedFees?.courier ?? 0 : 0);

  const saveReport = async () => {
    if (!report || !usedFees) return;
    const money = report.money;
    try {
      const { data, meta } = await exportOrders(query);
      if (meta.truncated) alert(`الملف يحتوي على أول ${data.length} من ${meta.total} أوردر`);
      await downloadReport({
        fileName: "كشف_الحساب",
        sheetName: "كشف الحساب",
        summary: [
          ["تاريخ البداية:", filters.from, "", "", "", "الإجمالي الكلي:", report.total.amount],
          ["تاريخ النهاية:", filters.to, "", "", "", "الإجمالي المسلّم:", money.deliveredTotal],
          ["إجمالي الأوردرات:", report.total.count, "", "", "", "العمولة:", money.courierCommission],
          ["", "", "", "", "", "المتبقي بعد العمولة:", money.afterCourier],
          ["", "", "", "", "", "ربح الشركة:", money.companyCommission],
          ["", "", "", "", "", "فلوس التاجر:", money.merchantNet],
          ...ORDER_STATUSES.map((s) => [`${statusLabel(s)}:`, report.byStatus[s]?.count ?? 0]),
        ],
        columns: [
          { header: "رقم الشحنة", value: (o) => o.barcode },
          { header: "اسم العميل", value: (o) => o.fullName },
          { header: "رقم العميل", value: (o) => o.phone },
          { header: "العنوان", value: (o) => o.address },
          { header: "قيمة الطلب", value: (o) => o.cost },
          { header: "حالة الشحنة", value: (o) => statusLabel(o.status) },
          { header: "المندوب", value: (o) => o.courier?.name || "-" },
          { header: "الشركة", value: (o) => o.merchant?.name || "-" },
          { header: "العمولة", value: commission },
        ],
        rows: data,
      });
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap mb-4">
        <CourierSelect value={filters.courier} onChange={setFilter("courier")} placeholder="اختر مندوب" className="border p-2 rounded" />

        <select className="border p-2 rounded" value={filters.status} onChange={(e) => setFilter("status")(e.target.value)}>
          <option value="">اختر الحالة</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>

        <MerchantSelect value={filters.merchant} onChange={setFilter("merchant")} className="border p-1 rounded" />

        <div>
          <span> من :</span>
          <input type="date" className="border p-2 rounded" value={filters.from} onChange={(e) => setFilter("from")(e.target.value)} />
        </div>
        <div>
          <span>الى:</span>
          <input type="date" className="border p-2 rounded" value={filters.to} onChange={(e) => setFilter("to")(e.target.value)} />
        </div>

        <FeeInputs value={feeInput} onChange={setFeeInput} defaults={usedFees} onApply={() => setFees(feeInput)} />
      </div>

      {/* Summary */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {ORDER_STATUSES.map((s) => (
            <div key={s} className="p-4 rounded-lg text-center border">
              <p className="text-sm text-gray-500">{statusLabel(s)}</p>
              <h3 className="text-xl font-bold">{report.byStatus[s]?.count ?? 0}</h3>
            </div>
          ))}
          {[
            ["الإجمالي الكلي", report.total.amount],
            ["الإجمالي المسلّم", report.money.deliveredTotal],
            ["عمولة المندوب", report.money.courierCommission],
            ["المتبقي بعد العمولة", report.money.afterCourier],
            ["ربح الشركة", report.money.companyCommission],
            ["فلوس التاجر", report.money.merchantNet],
          ].map(([label, value]) => (
            <div key={label} className="p-4 rounded-lg text-center border">
              <p className="text-sm text-gray-500">{label}</p>
              <h3 className="text-xl font-bold"><Money value={value} /></h3>
            </div>
          ))}
        </div>
      )}

      {/* Table (paginated) */}
      <div className="rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-center border">
          <thead>
            <tr>
              {["رقم الشحنة", "اسم العميل", "رقم العميل", "العنوان", "قيمة الطلب", "حالة الشحنة", "المندوب", "الشركة", "العمولة"].map((h) => (
                <th key={h} className="p-2 border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((order) => (
              <tr key={order._id} className="border-b">
                <td className="p-2">{order.barcode}</td>
                <td className="p-2">{order.fullName}</td>
                <td className="p-2">{order.phone}</td>
                <td className="p-2">{order.address}</td>
                <td className="p-2"><Money value={order.cost} /></td>
                <td className="p-2">{statusLabel(order.status)}</td>
                <td className="p-2">{order.courier?.name || "-"}</td>
                <td className="p-2">{order.merchant?.name || "-"}</td>
                <td className="p-2 text-green-600 font-bold"><Money value={commission(order)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={pages} onChange={setPage} />

      <div className="flex gap-4 flex-wrap">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={saveReport}>
          حفظ كشف الحساب
        </button>
      </div>
    </div>
  );
}
