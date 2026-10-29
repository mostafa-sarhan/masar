import { useState, type FormEvent } from "react";
import type { CreateOrderInput, OrderUpdate, OrderStatus, Role } from "@masar/shared";
import type { Order } from "@/lib/types";
import { toLatinDigits } from "@/lib/digits";
import { nextStatuses, statusLabel } from "@/lib/order-status";
import CourierSelect from "@/features/couriers/components/CourierSelect";
import MerchantSelect from "@/features/merchants/components/MerchantSelect";

// Create (no initialData) or admin edit. On edit only the fields that changed are sent.
type OrderFormProps =
  | { initialData?: undefined; onSubmit(data: CreateOrderInput): void; role?: Role }
  | { initialData: Order; onSubmit(changes: OrderUpdate): void; role?: Role };

type FormState = { fullName: string; address: string; phone: string; cost: string; merchant: string; courier: string; status: OrderStatus };

export default function OrderForm({ initialData, onSubmit, role }: OrderFormProps) {
  const editing = !!initialData;
  const start = {
    fullName: initialData?.fullName || "",
    address: initialData?.address || "",
    phone: initialData?.phone || "",
    cost: String(initialData?.cost ?? ""),
    merchant: initialData?.merchant?._id || "",
    courier: initialData?.courier?._id || "",
    status: (initialData?.status || "pending") as OrderStatus,
  };
  const [form, setForm] = useState<FormState>(start);
  const set = (name: keyof FormState) => (value: string) => setForm((f) => ({ ...f, [name]: value }));
  const statusOptions = editing ? [start.status, ...nextStatuses(start.status, role)] : [];

  const normalize = (f: FormState) => ({ ...f, cost: Number(f.cost), courier: f.courier || null });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const { status, courier, ...data } = normalize(form);
    if (!initialData) return (onSubmit as (d: CreateOrderInput) => void)(courier ? { ...data, courier } : data);

    const before: Record<string, unknown> = normalize(start);
    const after = { ...data, courier, status };
    (onSubmit as (c: OrderUpdate) => void)(Object.fromEntries(Object.entries(after).filter(([k, v]) => v !== before[k])) as OrderUpdate);
  };

  const field = (label: string, name: keyof FormState, transform: (v: string) => string = (v) => v) => (
    <div className="flex flex-col">
      <label className="mb-1 text-2xl text-right">{label}</label>
      <input value={form[name]} onChange={(e) => set(name)(transform(e.target.value))} className="border rounded-lg p-2" required />
    </div>
  );

  return (
    <form className="grid grid-cols-2 gap-8 w-[90%]" onSubmit={handleSubmit}>
      {field("اسم العميل", "fullName")}
      {field("رقم الهاتف", "phone", toLatinDigits)}
      {field("العنوان", "address")}
      {field("المبلغ", "cost", toLatinDigits)}

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
