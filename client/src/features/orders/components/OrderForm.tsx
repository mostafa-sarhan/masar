import { useCallback, useState, type FormEvent } from "react";
import type { CreateOrderInput, OrderUpdate, OrderStatus, Role } from "@masar/shared";
import type { Order } from "@/lib/types";
import { toLatinDigits } from "@/lib/digits";
import { isAdmin } from "@/lib/roles";
import { nextStatuses, statusLabel } from "@/lib/order-status";
import { quoteShipping } from "@/lib/resources-api";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import CourierSelect from "@/features/couriers/components/CourierSelect";
import MerchantSelect from "@/features/merchants/components/MerchantSelect";
import { GovernorateSelect, CitySelect } from "@/features/locations/components/PlaceSelects";
import { useShippingQuote } from "@/features/zones/hooks/use-shipping-quote";
import { ShippingQuoteNote } from "@/features/zones/components/ShippingQuoteNote";

type OrderFormProps =
  | { initialData?: undefined; onSubmit(data: CreateOrderInput): Promise<void>; role?: Role; submitLabel?: string }
  | { initialData: Order; onSubmit(changes: OrderUpdate): Promise<void>; role?: Role; submitLabel?: string };

type FormState = {
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  cost: string;
  shippingFee: string;
  merchant: string;
  courier: string;
  description: string;
  status: OrderStatus;
};

// Create, or (owner/admin) edit. On edit only the changed fields are sent.
// The shipping price is quoted from the destination; admins may type their own.
export default function OrderForm({ initialData, onSubmit, role, submitLabel }: OrderFormProps) {
  const editing = !!initialData;
  const admin = isAdmin(role);
  const start: FormState = {
    fullName: initialData?.fullName ?? "",
    phone: initialData?.phone ?? "",
    governorate: initialData?.governorate ?? "",
    city: initialData?.city ?? "",
    address: initialData?.address ?? "",
    cost: initialData ? String(initialData.cost) : "",
    shippingFee: initialData?.shippingFee != null ? String(initialData.shippingFee) : "",
    merchant: initialData?.merchant?._id ?? "",
    courier: initialData?.courier?._id ?? "",
    description: initialData?.description ?? "",
    status: initialData?.status ?? "pending",
  };
  const [form, setForm] = useState<FormState>(start);
  const [saving, setSaving] = useState(false);
  const set = (name: keyof FormState) => (value: string) => setForm((f) => ({ ...f, [name]: value }));
  const statusOptions = editing ? [start.status, ...nextStatuses(start.status, role)] : [];
  const feeLocked = initialData?.status === "delivered";

  const fetchQuote = useCallback((governorate: string, city: string) => quoteShipping({ governorate, city: city || undefined, merchant: form.merchant || undefined }), [form.merchant]);
  const { quote, loading } = useShippingQuote(fetchQuote, form.governorate, form.city, form.merchant);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const data = {
      fullName: form.fullName,
      phone: form.phone,
      governorate: form.governorate,
      city: form.city,
      address: form.address,
      cost: Number(form.cost),
      merchant: form.merchant,
      description: form.description || undefined,
    };
    // Only an admin's own price is sent; otherwise the server uses the zone's quote.
    const ownFee = admin && form.shippingFee !== "" ? Number(form.shippingFee) : undefined;
    try {
      setSaving(true);
      if (!initialData) {
        await (onSubmit as (d: CreateOrderInput) => Promise<void>)({ ...data, ...(form.courier && { courier: form.courier }), ...(ownFee !== undefined && { shippingFee: ownFee }) });
        return;
      }
      const after: Record<string, unknown> = { ...data, description: form.description, courier: form.courier || null, status: form.status, ...(ownFee !== undefined && { shippingFee: ownFee }) };
      const before: Record<string, unknown> = { ...start, cost: Number(start.cost), courier: start.courier || null, shippingFee: start.shippingFee === "" ? undefined : Number(start.shippingFee) };
      await (onSubmit as (c: OrderUpdate) => Promise<void>)(Object.fromEntries(Object.entries(after).filter(([k, v]) => v !== before[k])) as OrderUpdate);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="اسم العميل">{(p) => <Input {...p} value={form.fullName} onChange={(e) => set("fullName")(e.target.value)} required maxLength={100} autoComplete="off" />}</Field>
      <Field label="رقم الهاتف">{(p) => <Input {...p} dir="ltr" inputMode="tel" value={form.phone} onChange={(e) => set("phone")(toLatinDigits(e.target.value))} required pattern="\+?\d{6,15}" title="أرقام فقط، من 6 إلى 15 رقمًا" />}</Field>
      <Field label="المحافظة">
        {(p) => <GovernorateSelect {...p} required value={form.governorate} onChange={(g) => setForm((f) => ({ ...f, governorate: g, city: g === f.governorate ? f.city : "" }))} />}
      </Field>
      <Field label="المدينة / المنطقة">{(p) => <CitySelect {...p} required governorate={form.governorate} value={form.city} onChange={set("city")} />}</Field>
      <Field label="العنوان بالتفصيل" hint="الشارع، رقم العمارة، الدور، علامة مميزة" className="sm:col-span-2">
        {(p) => <Input {...p} value={form.address} onChange={(e) => set("address")(e.target.value)} required maxLength={300} />}
      </Field>
      <Field label="المبلغ المطلوب تحصيله">{(p) => <Input {...p} dir="ltr" inputMode="decimal" value={form.cost} onChange={(e) => set("cost")(toLatinDigits(e.target.value))} required pattern="\d+(\.\d{1,2})?" title="مبلغ صحيح" />}</Field>
      <Field label="التاجر">{(p) => <MerchantSelect {...p} value={form.merchant} onChange={set("merchant")} required />}</Field>
      {admin ? (
        <Field
          label="سعر الشحن"
          hint={feeLocked ? "لا يتغير بعد تسليم الشحنة" : <ShippingQuoteNote quote={quote} loading={loading} governorate={form.governorate} />}
        >
          {(p) => (
            <Input
              {...p}
              dir="ltr"
              inputMode="decimal"
              disabled={feeLocked}
              placeholder={quote?.shippingFee != null ? String(quote.shippingFee) : "حسب المنطقة"}
              value={form.shippingFee}
              onChange={(e) => set("shippingFee")(toLatinDigits(e.target.value))}
              pattern="\d+(\.\d{1,2})?"
              title="مبلغ صحيح"
            />
          )}
        </Field>
      ) : (
        <div className="flex items-end pb-2 text-sm text-ink-2">
          <ShippingQuoteNote quote={quote} loading={loading} governorate={form.governorate} />
        </div>
      )}
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
