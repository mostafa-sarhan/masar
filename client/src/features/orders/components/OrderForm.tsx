import { useState, type FormEvent } from "react";
import type { CreateOrderInput, OrderUpdate, OrderStatus, Role } from "@masar/shared";
import type { Order } from "@/lib/types";
import { toLatinDigits } from "@/lib/digits";
import { nextStatuses, statusLabel } from "@/lib/order-status";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import CourierSelect from "@/features/couriers/components/CourierSelect";
import MerchantSelect from "@/features/merchants/components/MerchantSelect";

type OrderFormProps =
  | { initialData?: undefined; onSubmit(data: CreateOrderInput): Promise<void>; role?: Role; submitLabel?: string }
  | { initialData: Order; onSubmit(changes: OrderUpdate): Promise<void>; role?: Role; submitLabel?: string };

type FormState = { fullName: string; address: string; phone: string; cost: string; merchant: string; courier: string; description: string; status: OrderStatus };

// Create, or (owner/admin) edit. On edit only the changed fields are sent.
export default function OrderForm({ initialData, onSubmit, role, submitLabel }: OrderFormProps) {
  const editing = !!initialData;
  const start: FormState = {
    fullName: initialData?.fullName ?? "",
    address: initialData?.address ?? "",
    phone: initialData?.phone ?? "",
    cost: initialData ? String(initialData.cost) : "",
    merchant: initialData?.merchant?._id ?? "",
    courier: initialData?.courier?._id ?? "",
    description: initialData?.description ?? "",
    status: initialData?.status ?? "pending",
  };
  const [form, setForm] = useState<FormState>(start);
  const [saving, setSaving] = useState(false);
  const set = (name: keyof FormState) => (value: string) => setForm((f) => ({ ...f, [name]: value }));
  const statusOptions = editing ? [start.status, ...nextStatuses(start.status, role)] : [];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const data = { fullName: form.fullName, phone: form.phone, address: form.address, cost: Number(form.cost), merchant: form.merchant, description: form.description || undefined };
    try {
      setSaving(true);
      if (!initialData) {
        await (onSubmit as (d: CreateOrderInput) => Promise<void>)({ ...data, ...(form.courier && { courier: form.courier }) });
        return;
      }
      const after: Record<string, unknown> = { ...data, description: form.description, courier: form.courier || null, status: form.status };
      const before: Record<string, unknown> = { ...start, cost: Number(start.cost), courier: start.courier || null };
      await (onSubmit as (c: OrderUpdate) => Promise<void>)(Object.fromEntries(Object.entries(after).filter(([k, v]) => v !== before[k])) as OrderUpdate);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="اسم العميل">{(p) => <Input {...p} value={form.fullName} onChange={(e) => set("fullName")(e.target.value)} required maxLength={100} autoComplete="off" />}</Field>
      <Field label="رقم الهاتف">{(p) => <Input {...p} dir="ltr" inputMode="tel" value={form.phone} onChange={(e) => set("phone")(toLatinDigits(e.target.value))} required pattern="\+?\d{6,15}" title="أرقام فقط، من 6 إلى 15 رقمًا" />}</Field>
      <Field label="العنوان" className="sm:col-span-2">{(p) => <Input {...p} value={form.address} onChange={(e) => set("address")(e.target.value)} required maxLength={300} />}</Field>
      <Field label="المبلغ المطلوب تحصيله">{(p) => <Input {...p} dir="ltr" inputMode="decimal" value={form.cost} onChange={(e) => set("cost")(toLatinDigits(e.target.value))} required pattern="\d+(\.\d{1,2})?" title="مبلغ صحيح" />}</Field>
      <Field label="التاجر">{(p) => <MerchantSelect {...p} value={form.merchant} onChange={set("merchant")} required />}</Field>
      <Field label="المندوب" hint={editing ? undefined : "اختياري: اختر مندوبًا لتسليمه الشحنة مباشرة"}>{(p) => <CourierSelect {...p} value={form.courier} onChange={set("courier")} placeholder="بدون مندوب" />}</Field>
      {editing && (
        <Field label="الحالة" hint="الحالات المتاحة فقط حسب مسار الشحنة">
          {(p) => (
            <Select {...p} value={form.status} onChange={(e) => set("status")(e.target.value)}>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}
      <Field label="ملاحظات" className="sm:col-span-2">{(p) => <Textarea {...p} value={form.description} onChange={(e) => set("description")(e.target.value)} maxLength={1000} placeholder="مثال: الاتصال قبل الوصول" />}</Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={saving} size="lg" className="w-full sm:w-auto">
          {submitLabel ?? (editing ? "حفظ التعديلات" : "إنشاء الشحنة")}
        </Button>
      </div>
    </form>
  );
}
