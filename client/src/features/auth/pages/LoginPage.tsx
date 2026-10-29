import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/auth-context";
import { AuthShell } from "../components/AuthShell";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Feedback";
import { errorMessage } from "@/lib/errors";
import { homeFor } from "@/lib/roles";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, sessionError } = useAuth();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const user = await login(email, password);
      navigate(homeFor(user.role));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const message = error || (sessionError ? errorMessage(sessionError) : "");

  return (
    <AuthShell title="تسجيل الدخول" description="ادخل ببريدك الإلكتروني في الشركة.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="البريد الإلكتروني">{(p) => <Input {...p} type="email" dir="ltr" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />}</Field>
        <Field label="كلمة المرور">{(p) => <Input {...p} type="password" dir="ltr" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}</Field>
        {message && <Notice tone="danger">{message}</Notice>}
        <Button type="submit" size="lg" loading={loading} className="w-full">
          دخول
        </Button>
      </form>
    </AuthShell>
  );
}
