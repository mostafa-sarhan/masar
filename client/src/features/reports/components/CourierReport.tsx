import { useEffect, useState } from "react";
import { getCourierReport } from "../services/resourcesApi";
import { errorMessage } from "../services/errors";
import FeeInputs from "../FeeInputs";
import Money from "../Money";
import { statusLabel } from "../utils/orderStatus";

const COLUMNS = ["delivered", "returned", "refused", "pending", "with_courier"];

// Results and commission per courier (the courier fee is internal: shown here only).
export default function CourierReport() {
  const [rows, setRows] = useState([]);
  const [feeInput, setFeeInput] = useState({ courierFee: "", companyFee: "" });
  const [fees, setFees] = useState(feeInput);
  const [range, setRange] = useState({ from: "", to: "" });
  const [defaults, setDefaults] = useState(null);

  useEffect(() => {
    getCourierReport({ archived: "all", ...range, ...fees })
      .then(({ data, meta }) => {
        setRows(data.filter((r) => r.courier));
        setDefaults(meta.fees);
      })
      .catch((err) => alert(errorMessage(err)));
  }, [fees, range]);

  return (
    <div className="space-y-6">
      <div className="flex gap-4 flex-wrap items-center">
        <label>من <input type="date" className="border p-2 rounded" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></label>
        <label>إلى <input type="date" className="border p-2 rounded" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></label>
        <FeeInputs value={feeInput} onChange={setFeeInput} defaults={defaults} onApply={() => setFees(feeInput)} showCompany={false} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-400 text-center">
          <thead>
            <tr>
              <th className="border p-2">المندوب</th>
              {COLUMNS.map((s) => <th key={s} className="border p-2">{statusLabel(s)}</th>)}
              <th className="border p-2">نقدية المسلّم</th>
              <th className="border p-2">عمولة المندوب</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.courier._id}>
                <td className="border p-2">{r.courier.name}</td>
                {COLUMNS.map((s) => <td key={s} className="border p-2">{r.byStatus[s]?.count ?? 0}</td>)}
                <td className="border p-2"><Money value={r.money.deliveredTotal} /></td>
                <td className="border p-2 font-bold"><Money value={r.money.courierCommission} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
