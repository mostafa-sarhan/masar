import type { MerchantDeduction } from "@masar/shared";
import type { TenantSettings } from "@/lib/types";
import { useEffect, useState, type FormEvent } from "react";
import { getSettings, updateSettings } from "@/lib/resources-api";
import { errorMessage } from "@/lib/errors";
import { useAuth } from "@/app/auth-context";

const CURRENCIES = ["EGP", "SAR", "AED", "KWD", "QAR", "BHD", "OMR", "JOD", "USD"];
const TIMEZONES = Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : ["Africa/Cairo", "Asia/Riyadh", "Asia/Dubai", "UTC"];

const field = "border rounded p-2 text-black bg-white";

// Company settings (owner/admin). Fee changes apply to orders delivered from now on.
export default function Settings() {
  const { tenantChanged } = useAuth();
  const [form, setForm] = useState<TenantSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(setForm).catch((err) => alert(errorMessage(err)));
  }, []);

  if (!form) return <div className="p-6">جاري التحميل...</div>;

  const set = (patch: Partial<TenantSettings>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const toggleDeduction = (key: MerchantDeduction) =>
    set({ merchantDeductions: form.merchantDeductions.includes(key) ? form.merchantDeductions.filter((d) => d !== key) : [...form.merchantDeductions, key] });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const saved = await updateSettings({
        fees: { courier: Number(form.fees.courier), company: Number(form.fees.company) },
        merchantDeductions: form.merchantDeductions,
        archiveAfterDays: Number(form.archiveAfterDays),
        timezone: form.timezone,
        currency: form.currency,
        labelName: form.labelName || null,
        logoUrl: form.logoUrl || null,
      });
      setForm(saved);
      tenantChanged({ currency: saved.currency, timezone: saved.timezone });
      alert("تم حفظ الإعدادات ✅");
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="p-6 space-y-6 text-start max-w-3xl">
      <h2 className="text-2xl font-bold">إعدادات الشركة</h2>

      <section className="space-y-2">
        <h3 className="text-xl font-bold">العمولات (لكل أوردر مسلّم)</h3>
        <p className="text-sm text-gray-300">التغيير يطبق على الأوردرات التي تُسلّم بعد الحفظ فقط؛ الأوردرات المسلّمة تحتفظ بعمولتها.</p>
        <div className="flex gap-4 flex-wrap items-center">
          <label>عمولة المندوب <input type="number" min="0" step="0.01" className={field} value={form.fees.courier} onChange={(e) => set({ fees: { ...form.fees, courier: Number(e.target.value) } })} /></label>
          <label>عمولة الشركة <input type="number" min="0" step="0.01" className={field} value={form.fees.company} onChange={(e) => set({ fees: { ...form.fees, company: Number(e.target.value) } })} /></label>
        </div>
        <div className="flex gap-6 flex-wrap">
          <span>يُخصم من التاجر:</span>
          <label><input type="checkbox" checked={form.merchantDeductions.includes("company")} onChange={() => toggleDeduction("company")} /> عمولة الشركة</label>
          <label><input type="checkbox" checked={form.merchantDeductions.includes("courier")} onChange={() => toggleDeduction("courier")} /> عمولة المندوب</label>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xl font-bold">عام</h3>
        <div className="flex gap-4 flex-wrap items-center">
          <label>الأرشفة بعد (أيام) <input type="number" min="1" max="365" className={field} value={form.archiveAfterDays} onChange={(e) => set({ archiveAfterDays: Number(e.target.value) })} /></label>
          <label>
            المنطقة الزمنية{" "}
            <select className={field} value={form.timezone} onChange={(e) => set({ timezone: e.target.value })}>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </label>
          <label>
            العملة{" "}
            <select className={field} value={form.currency} onChange={(e) => set({ currency: e.target.value })}>
              {[...new Set([form.currency, ...CURRENCIES])].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xl font-bold">الملصقات وصفحة التتبع</h3>
        <div className="flex gap-4 flex-wrap items-center">
          <label>الاسم الظاهر <input className={field} value={form.labelName ?? ""} onChange={(e) => set({ labelName: e.target.value })} /></label>
          <label>رابط الشعار (https) <input dir="ltr" className={`${field} w-80`} value={form.logoUrl ?? ""} onChange={(e) => set({ logoUrl: e.target.value })} /></label>
        </div>
      </section>

      <button disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg">{saving ? "جاري الحفظ..." : "حفظ"}</button>
    </form>
  );
}
