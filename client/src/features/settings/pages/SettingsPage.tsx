import { useEffect, useState, type FormEvent } from "react";
import type { MerchantDeduction } from "@masar/shared";
import { getSettings, updateSettings } from "@/lib/resources-api";
import { useAuth } from "@/app/auth-context";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { Field, Input, Checkbox } from "@/components/ui/Field";
import { Combobox, type ComboOption } from "@/components/ui/Combobox";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Feedback";
import { useFeedback } from "@/components/ui/feedback-context";
import { errorMessage } from "@/lib/errors";
import type { TenantSettings } from "@/lib/types";

const CURRENCIES: [string, string][] = [
  ["EGP", "جنيه مصري"],
  ["SAR", "ريال سعودي"],
  ["AED", "درهم إماراتي"],
  ["KWD", "دينار كويتي"],
  ["QAR", "ريال قطري"],
  ["BHD", "دينار بحريني"],
  ["OMR", "ريال عماني"],
  ["JOD", "دينار أردني"],
  ["USD", "دولار أمريكي"],
];
// Common zones first, then every zone the browser knows (searchable).
const COMMON_ZONES = ["Africa/Cairo", "Asia/Riyadh", "Asia/Dubai", "Asia/Kuwait", "Asia/Qatar", "Asia/Bahrain", "Asia/Muscat", "Asia/Amman", "Africa/Tripoli", "Africa/Casablanca", "UTC"];
const TIMEZONE_OPTIONS: ComboOption[] = [...new Set([...COMMON_ZONES, ...Intl.supportedValuesOf("timeZone")])].map((z) => ({ value: z, label: z }));
const CURRENCY_OPTIONS: ComboOption[] = CURRENCIES.map(([code, name]) => ({ value: code, label: `${name} (${code})`, keywords: [code] }));

type Form = { courierFee: string; companyFee: string; deductions: MerchantDeduction[]; archiveAfterDays: string; timezone: string; currency: string; labelName: string; logoUrl: string };
const toForm = (s: TenantSettings): Form => ({
  courierFee: String(s.fees.courier),
  companyFee: String(s.fees.company),
  deductions: s.merchantDeductions,
  archiveAfterDays: String(s.archiveAfterDays),
  timezone: s.timezone,
  currency: s.currency,
  labelName: s.labelName ?? "",
  logoUrl: s.logoUrl ?? "",
});

export default function SettingsPage() {
  const { tenantChanged } = useAuth();
  const { toast } = useFeedback();
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then((s) => setForm(toForm(s))).catch((err) => toast(errorMessage(err), "danger"));
  }, [toast]);

  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const toggle = (d: MerchantDeduction) => form && set({ deductions: form.deductions.includes(d) ? form.deductions.filter((x) => x !== d) : [...form.deductions, d] });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    try {
      setSaving(true);
      const saved = await updateSettings({
        fees: { courier: Number(form.courierFee), company: Number(form.companyFee) },
        merchantDeductions: form.deductions,
        archiveAfterDays: Number(form.archiveAfterDays),
        timezone: form.timezone,
        currency: form.currency,
        labelName: form.labelName.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
      });
      setForm(toForm(saved));
      tenantChanged({ currency: saved.currency, timezone: saved.timezone });
      toast("تم حفظ الإعدادات");
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-56" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="الإعدادات" description="تنطبق على كل مستخدمي الشركة." actions={<Button type="submit" loading={saving}>حفظ الإعدادات</Button>} />

      <Panel title="العمولات" bodyClassName="space-y-4">
        <p className="text-sm text-ink-2">لكل شحنة مسلّمة. التغيير يطبق على الشحنات التي تُسلّم بعد الحفظ؛ الشحنات المسلّمة تحتفظ بعمولتها.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="عمولة المندوب" hint="تكلفة داخلية للشركة">{(p) => <Input {...p} type="number" min={0} step="0.01" dir="ltr" value={form.courierFee} onChange={(e) => set({ courierFee: e.target.value })} required />}</Field>
          <Field label="عمولة الشركة" hint="يمكن تخصيصها لكل تاجر من صفحة التجار">{(p) => <Input {...p} type="number" min={0} step="0.01" dir="ltr" value={form.companyFee} onChange={(e) => set({ companyFee: e.target.value })} required />}</Field>
        </div>
        <fieldset className="rounded-md border border-rule-soft p-4">
          <legend className="px-1 text-sm font-medium text-ink">ما يُخصم من مستحقات التاجر</legend>
          <div className="flex flex-wrap gap-6">
            <Checkbox label="عمولة الشركة" checked={form.deductions.includes("company")} onChange={() => toggle("company")} />
            <Checkbox label="عمولة المندوب" checked={form.deductions.includes("courier")} onChange={() => toggle("courier")} />
          </div>
        </fieldset>
      </Panel>

      <Panel title="المنطقة والعملة" bodyClassName="grid gap-4 sm:grid-cols-3">
        <Field label="المنطقة الزمنية" hint="تحدد بداية اليوم في التقارير">
          {(p) => <Combobox {...p} value={form.timezone} onChange={(timezone) => timezone && set({ timezone })} options={TIMEZONE_OPTIONS} clearable={false} />}
        </Field>
        <Field label="العملة">
          {(p) => <Combobox {...p} value={form.currency} onChange={(currency) => currency && set({ currency })} options={CURRENCY_OPTIONS} clearable={false} />}
        </Field>
        <Field label="الأرشفة بعد (أيام)" hint="من تاريخ إغلاق الشحنة">{(p) => <Input {...p} type="number" min={1} max={365} dir="ltr" value={form.archiveAfterDays} onChange={(e) => set({ archiveAfterDays: e.target.value })} required />}</Field>
      </Panel>

      <Panel title="الملصقات وصفحة التتبع" bodyClassName="grid gap-4 sm:grid-cols-2">
        <Field label="الاسم الظاهر للعملاء" hint="يظهر على صفحة التتبع">{(p) => <Input {...p} value={form.labelName} onChange={(e) => set({ labelName: e.target.value })} maxLength={120} />}</Field>
        <Field label="رابط الشعار" hint="رابط صورة يبدأ بـ https">{(p) => <Input {...p} type="url" dir="ltr" value={form.logoUrl} onChange={(e) => set({ logoUrl: e.target.value })} placeholder="https://" />}</Field>
      </Panel>
    </form>
  );
}
