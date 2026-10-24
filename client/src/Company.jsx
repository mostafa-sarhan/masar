import React, { useState } from "react";
import { exportOrders } from "./services/ordersApi";
import { errorMessage } from "./services/errors";
import { useSummaryReport } from "./hooks/useSummaryReport";
import MerchantSelect from "./MerchantSelect";
import FeeInputs from "./FeeInputs";
import { downloadReport } from "./utils/excel";
import { STATUS_LABELS, statusLabel } from "./utils/orderStatus";

// Statement for one company (merchant) over a date range. All amounts come from the server.
export default function Company() {
  const [merchant, setMerchant] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [feeInput, setFeeInput] = useState({ courierFee: "", companyFee: "" });
  const [fees, setFees] = useState(feeInput); // applied on blur

  const filters = { archived: "all", merchant, from, to };
  const { report, fees: usedFees } = useSummaryReport({ ...filters, ...fees });
  const money = report?.money;

  const saveReport = async () => {
    if (!report) return;
    try {
      const { data, meta } = await exportOrders(filters);
      if (meta.truncated) alert(`الملف يحتوي على أول ${data.length} من ${meta.total} أوردر`);
      const merchantName = merchant ? data[0]?.merchant?.name : null;
      await downloadReport({
        fileName: `كشف_حساب_${merchantName || "جميع"}`,
        sheetName: "كشف الحساب",
        summary: [
          ["تاريخ البداية:", from, "", "", "", "المبلغ المستلم:", money.deliveredTotal],
          ["تاريخ النهاية:", to, "", "", "", "عمولة الشركة:", money.companyCommission],
          ["إجمالي الأوردرات:", report.total.count, "", "", "", "فلوس التاجر بعد الخصم:", money.merchantNet],
          ["عمولة الشركة لكل أوردر:", usedFees.company],
          ...Object.keys(STATUS_LABELS).map((s) => [`${statusLabel(s)}:`, report.byStatus[s]?.count ?? 0, "المبلغ:", report.byStatus[s]?.amount ?? 0]),
        ],
        columns: [
          { header: "رقم الشحنة", value: (o) => o.barcode },
          { header: "اسم العميل", value: (o) => o.fullName },
          { header: "قيمة الطلب", value: (o) => o.cost },
          { header: "حالة الشحنة", value: (o) => statusLabel(o.status) },
          { header: "المندوب", value: (o) => o.courier?.name || "-" },
          { header: "الشركة", value: (o) => o.merchant?.name || "-" },
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
        <MerchantSelect value={merchant} onChange={setMerchant} className="border p-2 rounded" />
        <div>
          <span> من :</span>
          <input type="date" className="border p-2 rounded" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <span>الى: </span>
          <input type="date" className="border p-2 rounded" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <FeeInputs value={feeInput} onChange={setFeeInput} defaults={usedFees} onApply={() => setFees(feeInput)} showCourier={false} />
      </div>

      {/* Summary */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          {Object.keys(STATUS_LABELS).map((s) => (
            <div key={s} className="p-4 rounded-lg text-center border">
              <p className="text-sm text-gray-500">{statusLabel(s)}</p>
              <h3 className="text-xl font-bold">{report.byStatus[s]?.count ?? 0}</h3>
              <h3 className="text-xl font-bold">{report.byStatus[s]?.amount ?? 0} جنيه</h3>
            </div>
          ))}
          {[
            ["المبلغ المستلم", money.deliveredTotal],
            ["عمولة الشركة", money.companyCommission],
            ["فلوس التاجر بعد الخصم", money.merchantNet],
          ].map(([label, value]) => (
            <div key={label} className="p-4 rounded-lg text-center border">
              <p className="text-sm text-gray-500">{label}</p>
              <h3 className="text-xl font-bold">{value} جنيه</h3>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4 flex-wrap">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg" onClick={saveReport}>
          حفظ كشف الحساب
        </button>
      </div>
    </div>
  );
}
