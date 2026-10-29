import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { accessRequestBody, type AccessRequestInput } from "@masar/shared";
import { submitAccessRequest } from "../api/access-api";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Feedback";
import { errorMessage } from "@/lib/errors";
import { toLatinDigits } from "@/lib/digits";

type Values = Required<Omit<AccessRequestInput, "website">>;
const EMPTY: Values = { companyName: "", contactName: "", phone: "", email: "", message: "" };

const FIELD_ERRORS: Record<keyof Values, string> = {
  companyName: "اكتب اسم الشركة (حرفان على الأقل)",
  contactName: "اكتب اسمك",
  phone: "رقم الهاتف أرقام فقط، من 6 إلى 15 رقمًا",
  email: "البريد الإلكتروني غير صحيح",
  message: "الرسالة أطول من 1000 حرف",
};

// The public "Request access" form. `website` is a honeypot that people never see.
export function AccessRequestForm() {
  const [values, setValues] = useState(EMPTY);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (name: keyof Values, transform: (v: string) => string = (v) => v) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [name]: transform(e.target.value) }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const body = { ...values, message: values.message.trim() || undefined, website: website || undefined };
    const parsed = accessRequestBody.safeParse(body);
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Values;
        if (key in FIELD_ERRORS) next[key] = FIELD_ERRORS[key];
      }
      return setErrors(next);
    }
    try {
      setSending(true);
      await submitAccessRequest(parsed.data);
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-3 py-6" role="status">
        <CheckCircle2 className="size-8 text-ok" aria-hidden />
        <p className="text-lg font-semibold text-ink">وصل طلبك</p>
        <p className="text-ink-2">سنراجع بيانات شركتك ونرسل بيانات الدخول إلى <span dir="ltr">{values.email}</span>.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="اسم الشركة" error={errors.companyName}>{(p) => <Input {...p} autoComplete="organization" value={values.companyName} onChange={set("companyName")} />}</Field>
      <Field label="اسمك" error={errors.contactName}>{(p) => <Input {...p} autoComplete="name" value={values.contactName} onChange={set("contactName")} />}</Field>
      <Field label="رقم الهاتف" error={errors.phone}>{(p) => <Input {...p} dir="ltr" inputMode="tel" autoComplete="tel" value={values.phone} onChange={set("phone", (v) => toLatinDigits(v).replace(/[\s-]/g, ""))} />}</Field>
      <Field label="البريد الإلكتروني" error={errors.email}>{(p) => <Input {...p} dir="ltr" type="email" autoComplete="email" value={values.email} onChange={set("email")} />}</Field>
      <Field label="عن شركتك" hint="اختياري: عدد المناديب والشحنات اليومية تقريبًا" error={errors.message} className="sm:col-span-2">
        {(p) => <Textarea {...p} rows={3} value={values.message} onChange={set("message")} />}
      </Field>
      {/* Honeypot: hidden from people and assistive tech; bots that fill it are dropped silently. */}
      <div aria-hidden className="sr-only">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
        </label>
      </div>
      {error && <Notice tone="danger" className="sm:col-span-2">{error}</Notice>}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" loading={sending}>إرسال الطلب</Button>
      </div>
    </form>
  );
}
