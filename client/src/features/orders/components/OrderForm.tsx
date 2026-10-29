import React, { useState } from "react";
import { convertArabicNumbersToEnglish } from "./utils/numberUtils";
import { nextStatuses, statusLabel } from "./utils/orderStatus";
import CourierSelect from "./CourierSelect";
import MerchantSelect from "./MerchantSelect";

// Create (no initialData) or admin edit. On edit only the fields that changed are sent.
export default function FormOrder({ initialData, onSubmit, role }) {
  const editing = !!initialData;
  const start = {
    fullName: initialData?.fullName || "",
    address: initialData?.address || "",
    phone: initialData?.phone || "",
    cost: initialData?.cost ?? "",
    merchant: initialData?.merchant?._id || "",
    courier: initialData?.courier?._id || "",
    status: initialData?.status || "pending",
  };
  const [form, setForm] = useState(start);
  const set = (name) => (value) => setForm((f) => ({ ...f, [name]: value }));
  const statusOptions = editing ? [start.status, ...nextStatuses(start.status, role)] : [];

  const normalize = (f) => ({ ...f, cost: Number(f.cost), courier: f.courier || null });

  const handleSubmit = (e) => {
    e.preventDefault();
    const { status, courier, ...data } = normalize(form);
    if (!editing) return onSubmit(courier ? { ...data, courier } : data);

    const before = normalize(start);
    const after = { ...data, courier, status };
    onSubmit(Object.fromEntries(Object.entries(after).filter(([k, v]) => v !== before[k])));
  };

  const field = (label, name, transform = (v) => v) => (
    <div className="flex flex-col">
      <label className="mb-1 text-2xl text-right">{label}</label>
      <input value={form[name]} onChange={(e) => set(name)(transform(e.target.value))} className="border rounded-lg p-2" required />
    </div>
  );

  return (
    <form className="grid grid-cols-2 gap-8 w-[90%]" onSubmit={handleSubmit}>
      {field("اسم العميل", "fullName")}
      {field("رقم الهاتف", "phone", convertArabicNumbersToEnglish)}
      {field("العنوان", "address")}
      {field("المبلغ", "cost", convertArabicNumbersToEnglish)}

      <div className="flex flex-col">
        <label className="mb-1 text-2xl text-right">اسم الشركة</label>
        <MerchantSelect value={form.merchant} onChange={set("merchant")} required />
      </div>

      <div className="flex flex-col">
        <label className="mb-1 text-2xl text-right">اسم المندوب</label>
        <CourierSelect value={form.courier} onChange={set("courier")} placeholder="لم يحدد" />
      </div>

      {editing && (
        <div className="flex flex-col">
          <label className="mb-1 text-2xl text-right">الحالة</label>
          <select value={form.status} onChange={(e) => set("status")(e.target.value)} className="border rounded-lg p-2">
            {statusOptions.map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>
        </div>
      )}

      <div className="col-span-2">
        <button className="bg-blue-500 text-white text-2xl w-full py-2 rounded cursor-pointer">حفظ</button>
      </div>
    </form>
  );
}
