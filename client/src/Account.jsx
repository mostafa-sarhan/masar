import Money from "./Money";
import React, { useState } from "react";
import { exportOrders } from "./services/ordersApi";
import { errorMessage } from "./services/errors";
import { useSummaryReport } from "./hooks/useSummaryReport";
import { usePagedOrders } from "./hooks/usePagedOrders";
import CourierSelect from "./CourierSelect";
import MerchantSelect from "./MerchantSelect";
import FeeInputs from "./FeeInputs";
import Pagination from "./Pagination";
import { downloadReport } from "./utils/excel";
import { ORDER_STATUSES, STATUS_LABELS, statusLabel } from "./utils/orderStatus";

const PAGE_SIZE = 25;

// Accounts statement by courier / status / company / dates. Totals come from the server;
// the table is paginated.
export default function Account() {
  const [filters, setFilters] = useState({ courier: "", status: "", merchant: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [feeInput, setFeeInput] = useState({ courierFee: "", companyFee: "" });
  const [fees, setFees] = useState(feeInput);
  const setFilter = (name) => (value) => {
    setFilters((f) => ({ ...f, [name]: value }));
    setPage(1);
  };

  const query = { archived: "all", ...filters };
  const { report, fees: usedFees } = useSummaryReport({ ...query, ...fees });
  const { items } = usePagedOrders({ ...query, page, limit: PAGE_SIZE });
  const pages = report ? Math.ceil(report.total.count / PAGE_SIZE) : 0;
  const money = report?.money;
  const commission = (o) => (o.status === "delivered" ? usedFees?.courier ?? 0 : 0);

  const saveReport = async () => {
    if (!report) return;
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
          ...Object.keys(STATUS_LABELS).map((s) => [`${statusLabel(s)}:`, report.byStatus[s]?.count ?? 0]),
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
          {Object.keys(STATUS_LABELS).map((s) => (
            <div key={s} className="p-4 rounded-lg text-center border">
              <p className="text-sm text-gray-500">{statusLabel(s)}</p>
              <h3 className="text-xl font-bold">{report.byStatus[s]?.count ?? 0}</h3>
            </div>
          ))}
          {[
            ["الإجمالي الكلي", report.total.amount],
            ["الإجمالي المسلّم", money.deliveredTotal],
            ["عمولة المندوب", money.courierCommission],
            ["المتبقي بعد العمولة", money.afterCourier],
            ["ربح الشركة", money.companyCommission],
            ["فلوس التاجر", money.merchantNet],
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
