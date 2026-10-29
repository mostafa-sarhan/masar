import { useState } from "react";
import { importOrders, downloadImportTemplate } from "./services/ordersApi";
import { errorMessage } from "./services/errors";
import Money from "./Money";

const FIELD_LABELS = { fullName: "الاسم", phone: "الهاتف", address: "العنوان", cost: "المبلغ", merchant: "الشركة", description: "ملاحظات", reference: "المرجع" };

// Upload .xlsx -> dry run (errors per row) -> import (all-or-nothing).
export default function ImportOrders() {
  const [file, setFile] = useState(null);
  const [check, setCheck] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (mode) => {
    if (!file) return;
    try {
      setBusy(true);
      if (mode === "dry-run") setCheck(await importOrders(file, "dry-run"));
      else {
        const { created } = await importOrders(file, "commit");
        alert(`تم استيراد ${created} أوردر ✅`);
        setFile(null);
        setCheck(null);
      }
    } catch (err) {
      if (err.code === "IMPORT_INVALID") setCheck({ ...err.details, validRows: 0 });
      alert(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 space-y-4 text-start">
      <h2 className="text-2xl font-bold">استيراد أوردرات من Excel</h2>
      <p className="text-sm">ملف .xlsx واحد (حتى 2 ميجا و1000 صف). اسم الشركة يجب أن يطابق اسم التاجر في النظام.</p>
      <button onClick={() => downloadImportTemplate().catch((err) => alert(errorMessage(err)))} className="underline">تحميل نموذج الملف</button>

      <div className="flex gap-3 items-center flex-wrap">
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => {
            setFile(e.target.files[0] ?? null);
            setCheck(null);
          }}
        />
        <button disabled={!file || busy} onClick={() => run("dry-run")} className="bg-blue-600 px-4 py-2 rounded disabled:opacity-50">فحص الملف</button>
        <button
          disabled={!check || check.errors.length > 0 || busy}
          onClick={() => run("commit")}
          className="bg-green-600 px-4 py-2 rounded disabled:opacity-50"
        >
          استيراد {check && !check.errors.length ? `(${check.totalRows})` : ""}
        </button>
      </div>

      {check && (
        <div className="space-y-3">
          <p>عدد الصفوف: {check.totalRows} · صالح: {check.validRows} · أخطاء: {check.errors.length}</p>
          {check.errors.length > 0 && (
            <table className="w-full text-sm border text-center">
              <thead className="bg-red-900"><tr><th className="p-2 border">الصف</th><th className="p-2 border">العمود</th><th className="p-2 border">المشكلة</th></tr></thead>
              <tbody>
                {check.errors.map((e, i) => (
                  <tr key={i}><td className="p-2 border">{e.row}</td><td className="p-2 border">{FIELD_LABELS[e.field] || e.field}</td><td className="p-2 border" dir="auto">{e.message}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          {check.preview?.length > 0 && (
            <table className="w-full text-sm border text-center">
              <thead className="bg-gray-800"><tr>{["الصف", "الاسم", "الهاتف", "العنوان", "المبلغ", "الشركة"].map((h) => <th key={h} className="p-2 border">{h}</th>)}</tr></thead>
              <tbody>
                {check.preview.map((r) => (
                  <tr key={r.row}><td className="p-2 border">{r.row}</td><td className="p-2 border">{r.fullName}</td><td className="p-2 border" dir="ltr">{r.phone}</td><td className="p-2 border">{r.address}</td><td className="p-2 border"><Money value={r.cost} /></td><td className="p-2 border">{r.merchant}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
