import { useState, type FormEvent } from "react";
import { passwordProblems } from "@masar/shared";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Feedback";
import { errorMessage } from "@/lib/errors";

export const PASSWORD_HINT = "10 أحرف على الأقل، وتحتوي على حروف وأرقام";

const RULE_LABELS: Record<string, string> = {
  "At least 10 characters": "10 أحرف على الأقل",
  "At most 72 bytes": "أقصر من 72 بايت",
  "At least one letter": "حرف واحد على الأقل",
  "At least one digit": "رقم واحد على الأقل",
  "Must not contain the email name": "لا تحتوي على اسم البريد الإلكتروني",
};

interface ChangePasswordFormProps<T> {
  email?: string;
  onSubmit(current: string, next: string): Promise<T>;
  onDone(result: T): void;
  submitLabel?: string;
}

// Current + new + confirm, with the server's password policy checked as you type.
export default function ChangePasswordForm<T>({ email, onSubmit, onDone, submitLabel = "حفظ كلمة المرور" }: ChangePasswordFormProps<T>) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const problems = next ? passwordProblems(next, email) : [];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (problems.length) return setError("كلمة المرور الجديدة لا تطابق الشروط");
    if (next !== confirm) return setError("تأكيد كلمة المرور غير مطابق");
    try {
      setSaving(true);
      onDone(await onSubmit(current, next));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="كلمة المرور الحالية">{(p) => <Input {...p} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />}</Field>
      <Field label="كلمة المرور الجديدة" hint={next && problems.length ? problems.map((r) => RULE_LABELS[r]).join("، ") : PASSWORD_HINT}>
        {(p) => <Input {...p} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />}
      </Field>
      <Field label="تأكيد كلمة المرور الجديدة">{(p) => <Input {...p} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />}</Field>
      {error && <Notice tone="danger">{error}</Notice>}
      <Button type="submit" loading={saving} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
