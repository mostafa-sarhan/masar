import { useEffect, useState } from "react";
import { getMerchantReport } from "../services/resourcesApi";
import { errorMessage } from "../services/errors";
import FeeInputs from "../FeeInputs";
import Money from "../Money";
import { statusLabel } from "../utils/orderStatus";

const COUNT_COLUMNS = ["delivered", "returned", "refused", "pending", "exchanged", "with_courier"];

// Orders and money per merchant (server formula, fee snapshots).
export default function MerchantReport() {
  const [rows, setRows] = useState([]);
  const [feeInput, setFeeInput] = useState({ courierFee: "", companyFee: "" });
  const [fees, setFees] = useState(feeInput);
  const [range, setRange] = useState({ from: "", to: "" });
  const [defaults, setDefaults] = useState(null);

  useEffect(() => {
    getMerchantReport({ archived: "all", ...range, ...fees })
      .then(({ data, meta }) => {
        setRows(data.filter((r) => r.merchant));
        setDefaults(meta.fees);
      })
      .catch((err) => alert(errorMessage(err)));
  }, [fees, range]);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 flex-wrap items-center">
        <label>من <input type="date" className="border p-2 rounded" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></label>
        <label>إلى <input type="date" className="border p-2 rounded" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></label>
        <FeeInputs value={feeInput} onChange={setFeeInput} defaults={defaults} onApply={() => setFees(feeInput)} showCourier={false} />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-center text-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-2 border">التاجر</th>
              <th className="p-2 border">الإجمالي</th>
              {COUNT_COLUMNS.map((s) => <th key={s} className="p-2 border">{statusLabel(s)}</th>)}
              <th className="p-2 border">إجمالي المسلّم</th>
              <th className="p-2 border">عمولة الشركة</th>
              <th className="p-2 border">صافي التاجر</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ merchant, total, byStatus, money }) => (
              <tr key={merchant._id} className="border-b">
                <td className="p-2 font-bold">{merchant.name}</td>
                <td className="p-2">{total.count}</td>
                {COUNT_COLUMNS.map((s) => <td key={s} className="p-2">{byStatus[s]?.count ?? 0}</td>)}
                <td className="p-2"><Money value={money.deliveredTotal} /></td>
                <td className="p-2 text-yellow-400"><Money value={money.companyCommission} /></td>
                <td className="p-2 text-green-500 font-bold"><Money value={money.merchantNet} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
