import { useState, type FormEvent } from "react";
import { passwordProblems } from "@masar/shared";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Feedback";
import { errorMessage } from "@/lib/errors";

// Email + one-time password for a new login (employee, courier, merchant user).
// The person must replace the password at first sign-in.
export function AccountForm({ onSubmit, submitLabel = "إنشاء الحساب" }: { onSubmit(email: string, password: string): Promise<void>; submitLabel?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const problems = password ? passwordProblems(password, email) : [];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (problems.length) return setError("كلمة المرور المؤقتة لا تطابق الشروط: 10 أحرف على الأقل، وتحتوي على حروف وأرقام، ولا تحتوي على اسم البريد.");
    try {
      setSaving(true);
      await onSubmit(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="البريد الإلكتروني">{(p) => <Input {...p} type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />}</Field>
      <Field label="كلمة مرور مؤقتة" hint="أرسلها لصاحب الحساب؛ سيُطلب منه تغييرها عند أول دخول.">
        {(p) => <Input {...p} type="text" dir="ltr" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} required />}
      </Field>
      {error && <Notice tone="danger">{error}</Notice>}
      <Button type="submit" loading={saving} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
