import type { FeeValues } from "./FeeInputs";
import Money from "@/components/ui/Money";
import { useState } from "react";
import { exportOrders } from "@/features/orders/api/orders-api";
import { errorMessage } from "@/lib/errors";
import { useSummaryReport } from "@/features/reports/hooks/use-summary-report";
import MerchantSelect from "@/features/merchants/components/MerchantSelect";
import FeeInputs from "./FeeInputs";
import { downloadReport } from "@/features/reports/lib/excel";
import { ORDER_STATUSES, statusLabel } from "@/lib/order-status";

// Statement for one company (merchant) over a date range. All amounts come from the server.
export default function Company() {
  const [merchant, setMerchant] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [feeInput, setFeeInput] = useState<FeeValues>({ courierFee: "", companyFee: "" });
  const [fees, setFees] = useState<FeeValues>(feeInput); // applied on blur

  const filters = { archived: "all", merchant, from, to };
  const { report, fees: usedFees } = useSummaryReport({ ...filters, ...fees });

  const saveReport = async () => {
    if (!report || !usedFees) return;
    const money = report.money;
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
          ...ORDER_STATUSES.map((s) => [`${statusLabel(s)}:`, report.byStatus[s]?.count ?? 0, "المبلغ:", report.byStatus[s]?.amount ?? 0]),
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
          {ORDER_STATUSES.map((s) => (
            <div key={s} className="p-4 rounded-lg text-center border">
              <p className="text-sm text-gray-500">{statusLabel(s)}</p>
              <h3 className="text-xl font-bold">{report.byStatus[s]?.count ?? 0}</h3>
              <h3 className="text-xl font-bold"><Money value={report.byStatus[s]?.amount ?? 0} /></h3>
            </div>
          ))}
          {[
            ["المبلغ المستلم", report.money.deliveredTotal],
            ["عمولة الشركة", report.money.companyCommission],
            ["فلوس التاجر بعد الخصم", report.money.merchantNet],
          ].map(([label, value]) => (
            <div key={label} className="p-4 rounded-lg text-center border">
              <p className="text-sm text-gray-500">{label}</p>
              <h3 className="text-xl font-bold"><Money value={value} /></h3>
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
