import Money from "./Money";
import React, { useEffect, useState } from "react";
import { getMerchants, createMerchant, rotateMerchantKey, revokeMerchantKey, getMerchantReport, updateMerchant } from "./services/resourcesApi";
import { errorMessage } from "./services/errors";
import FeeInputs from "./FeeInputs";
import { createMerchantUser } from "./services/portalsApi";
import { promptAccount } from "./utils/promptAccount";

const COUNT_COLUMNS = ["delivered", "returned", "refused", "pending", "exchanged", "with_courier"];

export default function Member() {
  const [merchants, setMerchants] = useState([]);
  const [report, setReport] = useState([]);
  const [fees, setFees] = useState({ courierFee: "", companyFee: "" });
  const [defaults, setDefaults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [merchantName, setMerchantName] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState(null); // { name, apiKey } shown once

  useEffect(() => {
    Promise.all([getMerchants(), getMerchantReport({ archived: "all", ...fees })])
      .then(([merchantList, { data, meta }]) => {
        setMerchants(merchantList);
        setReport(data.filter((r) => r.merchant));
        setDefaults(meta.fees);
      })
      .catch((err) => alert(errorMessage(err)))
      .finally(() => setLoading(false));
    // fees are applied on blur via reloadKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const handleAddMerchant = async () => {
    if (!merchantName.trim()) return alert("اسم التاجر مطلوب");
    try {
      setAdding(true);
      const { merchant, apiKey } = await createMerchant(merchantName.trim());
      setNewKey({ name: merchant.name, apiKey });
      setMerchantName("");
      setShowAdd(false);
      reload();
    } catch (err) {
      alert("حصل خطأ أثناء إضافة التاجر: " + errorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const handleRotate = async (m) => {
    if (!window.confirm(`سيتم إيقاف المفتاح الحالي لـ ${m.name} فورًا. متابعة؟`)) return;
    try {
      const { apiKey } = await rotateMerchantKey(m._id);
      setNewKey({ name: m.name, apiKey });
      reload();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  // Empty = use the company's default fee (Settings).
  const handleCompanyFee = async (m) => {
    const value = window.prompt(`عمولة الشركة لـ ${m.name} لكل أوردر مسلّم (اتركها فارغة لاستخدام الافتراضي)`, m.companyFee ?? "");
    if (value === null) return;
    try {
      await updateMerchant(m._id, { companyFee: value.trim() === "" ? null : Number(value) });
      reload();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  const handleRevoke = async (m) => {
    if (!window.confirm(`إلغاء مفتاح ${m.name}؟ لن يتمكن من إرسال أوردرات.`)) return;
    try {
      await revokeMerchantKey(m._id);
      reload();
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  if (loading) {
    return <div className="w-full h-full flex justify-center items-center text-xl">جاري التحميل...</div>;
  }

  return (
    <div className="p-6 space-y-10">
      {/* Actions */}
      <div className="flex flex-wrap gap-4 items-center">
        <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded" onClick={() => setShowAdd(true)}>
          ➕ إضافة تاجر
        </button>
        <FeeInputs value={fees} onChange={setFees} defaults={defaults} onApply={reload} showCourier={false} />
      </div>

      {/* Orders by merchant */}
      <div>
        <h2 className="text-2xl font-bold mb-4">ملخص أوردرات التجار</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-center text-sm">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-2 border">التاجر</th>
                <th className="p-2 border">الإجمالي</th>
                <th className="p-2 border">تم التسليم</th>
                <th className="p-2 border">مرتجع</th>
                <th className="p-2 border">مرفوض</th>
                <th className="p-2 border">قيد التنفيذ</th>
                <th className="p-2 border">استبدال</th>
                <th className="p-2 border">مع المندوب</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r) => (
                <tr key={r.merchant._id} className="border-b hover:bg-gray-800">
                  <td className="p-2 font-bold">{r.merchant.name}</td>
                  <td className="p-2">{r.total.count}</td>
                  {COUNT_COLUMNS.map((s) => (
                    <td key={s} className="p-2">{r.byStatus[s]?.count ?? 0}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Money by merchant (server formula) */}
      <div>
        <h2 className="text-2xl font-bold mb-4">الحسابات المالية للتجار</h2>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-center text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-2 border">التاجر</th>
                <th className="p-2 border">عدد المسلّم</th>
                <th className="p-2 border">إجمالي المسلّم</th>
                <th className="p-2 border">عمولة الشركة</th>
                <th className="p-2 border">مستخدمو البوابة</th>
                <th className="p-2 border">صافي التاجر</th>
              </tr>
            </thead>
            <tbody>
              {report.map(({ merchant, money }) => (
                <tr key={merchant._id} className="border-b hover:bg-gray-800">
                  <td className="p-2 font-bold">{merchant.name}</td>
                  <td className="p-2">{money.deliveredCount}</td>
                  <td className="p-2"><Money value={money.deliveredTotal} /></td>
                  <td className="p-2 text-yellow-400"><Money value={money.companyCommission} /></td>
                  <td className="p-2 text-green-500 font-bold"><Money value={money.merchantNet} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add merchant */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-[350px]">
            <h3 className="text-xl font-bold mb-4">إضافة تاجر جديد</h3>
            <input type="text" placeholder="اسم التاجر" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} className="w-full mb-4 px-3 py-2 rounded bg-gray-800 border" />
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-600 rounded" onClick={() => setShowAdd(false)}>إلغاء</button>
              <button disabled={adding} className="px-4 py-2 bg-green-600 rounded" onClick={handleAddMerchant}>
                {adding ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New API key: shown once */}
      {newKey && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-[480px] space-y-4">
            <h3 className="text-xl font-bold">مفتاح API لـ {newKey.name}</h3>
            <p className="text-yellow-400 text-sm">انسخ المفتاح الآن، لن يظهر مرة أخرى.</p>
            <code className="block bg-gray-800 p-3 rounded break-all select-all" dir="ltr">{newKey.apiKey}</code>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-blue-600 rounded" onClick={() => navigator.clipboard?.writeText(newKey.apiKey)}>نسخ</button>
              <button className="px-4 py-2 bg-gray-600 rounded" onClick={() => setNewKey(null)}>تم</button>
            </div>
          </div>
        </div>
      )}

      {/* Merchants + keys */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">بيانات التجار</h2>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-center text-sm">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-2 border">اسم التاجر</th>
                <th className="p-2 border">API Key</th>
                <th className="p-2 border">عمولة الشركة</th>
                <th className="p-2 border">مستخدمو البوابة</th>
                <th className="p-2 border">تاريخ الإنشاء</th>
                <th className="p-2 border">المفتاح</th>
              </tr>
            </thead>
            <tbody>
              {merchants.length > 0 ? (
                merchants.map((m) => (
                  <tr key={m._id} className="border-b hover:bg-gray-800">
                    <td className="p-2 font-bold">{m.name}</td>
                    <td className="p-2 text-yellow-400" dir="ltr">
                      {m.hasActiveKey ? `${m.apiKeyPrefix}…` : m.apiKeyRevokedAt ? "ملغي" : "-"}
                    </td>
                    <td className="p-2">
                      <button className="underline" onClick={() => handleCompanyFee(m)}>{m.companyFee ?? "الافتراضي"}</button>
                    </td>
                    <td className="p-2 text-xs" dir="ltr">
                      {(m.users || []).map((u) => <div key={u}>{u}</div>)}
                      <button className="px-2 py-1 bg-green-700 rounded mt-1" onClick={async () => (await promptAccount(m.name, (e, p) => createMerchantUser(m._id, e, p))) && reload()}>+ مستخدم</button>
                    </td>
                    <td className="p-2">{m.createdAt ? new Date(m.createdAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }) : "-"}</td>
                    <td className="p-2 space-x-2 space-x-reverse">
                      <button className="px-2 py-1 bg-blue-600 rounded" onClick={() => handleRotate(m)}>{m.hasActiveKey ? "تغيير" : "إنشاء"}</button>
                      {m.hasActiveKey && <button className="px-2 py-1 bg-red-600 rounded" onClick={() => handleRevoke(m)}>إلغاء</button>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="p-4">لا يوجد تجار</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
