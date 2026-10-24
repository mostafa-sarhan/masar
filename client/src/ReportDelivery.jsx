import React, { useEffect, useState } from "react";
import { getCourierReport, createCourier } from "./services/resourcesApi";
import { errorMessage } from "./services/errors";

const COLUMNS = ["delivered", "returned", "refused", "pending", "with_courier"];

export default function ReportDelivery() {
  const [rows, setRows] = useState([]);
  const [fees, setFees] = useState(null);
  const [courierFee, setCourierFee] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    getCourierReport({ archived: "all", courierFee })
      .then(({ data, meta }) => {
        setRows(data.filter((r) => r.courier)); // skip unassigned orders
        setFees(meta.fees);
      })
      .catch((err) => alert(errorMessage(err)))
      .finally(() => setLoading(false));
    // courierFee is applied on blur, not on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const handleAddCourier = async () => {
    if (!newName.trim()) return alert("من فضلك أدخل اسم المندوب");
    try {
      await createCourier(newName.trim());
      setNewName("");
      setShowModal(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      alert("فشل إضافة المندوب: " + errorMessage(err));
    }
  };

  const report = rows.filter((r) => !selected || r.courier._id === selected);

  return (
    <div className="w-[98%] m-auto my-4">
      <h2 className="text-2xl font-bold mb-4 text-center">تقارير المناديب</h2>

      <div className="mb-4 flex gap-4 items-center flex-wrap">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="border-2 rounded-lg px-3 py-2 max-w-full">
          <option value="">-- اختر المندوب --</option>
          {rows.map((r) => (
            <option key={r.courier._id} value={r.courier._id}>{r.courier.name}</option>
          ))}
        </select>

        <span>عمولة المندوب:</span>
        <input
          type="number"
          min="0"
          placeholder={fees?.courier ?? ""}
          value={courierFee}
          onChange={(e) => setCourierFee(e.target.value)}
          onBlur={() => setReloadKey((k) => k + 1)}
          className="border rounded px-2 py-1 w-24"
        />

        <button onClick={() => setShowModal(true)} className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer">
          + إضافة مندوب
        </button>
      </div>

      {loading ? (
        <p className="text-center">جاري التحميل...</p>
      ) : report.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-400 text-center">
            <thead>
              <tr>
                <th className="border p-2">المندوب</th>
                <th className="border p-2">تم التسليم</th>
                <th className="border p-2">مرتجع</th>
                <th className="border p-2">مرفوض</th>
                <th className="border p-2">قيد التنفيذ</th>
                <th className="border p-2">مع المندوب</th>
                <th className="border p-2">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r) => (
                <tr key={r.courier._id}>
                  <td className="border p-2">{r.courier.name}</td>
                  {COLUMNS.map((s) => (
                    <td key={s} className="border p-2">{r.byStatus[s]?.count ?? 0}</td>
                  ))}
                  <td className="border p-2 font-bold">{r.money.courierCommission}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center">لا توجد بيانات</p>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-[400px] bg-main rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-right">إضافة مندوب جديد</h2>
            <input type="text" placeholder="اسم المندوب" value={newName} onChange={(e) => setNewName(e.target.value)} className="border-2 rounded w-full px-3 py-2 mb-4" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded cursor-pointer">إلغاء</button>
              <button onClick={handleAddCourier} className="bg-green-500 text-white px-4 py-2 rounded cursor-pointer">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
