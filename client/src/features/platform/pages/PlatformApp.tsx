import { useEffect, useState, type FormEvent } from "react";
import { platformLogin, platformLogout, platformMe, platformRefresh, platformChangePassword, type PlatformAdmin } from "@/features/platform/api/platform-api";
import { setSessionLostHandler } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import { FullPageLoading } from "@/app/ProtectedRoute";
import { AuthShell } from "@/features/auth/components/AuthShell";
import ChangePasswordForm from "@/features/auth/components/ChangePasswordForm";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Feedback";
import PlatformConsole from "./PlatformConsole";

const ASIDE = (
  <div className="max-w-md space-y-4">
    <p className="text-2xl font-semibold leading-snug text-white">لوحة تشغيل منصة مسار</p>
    <p className="leading-relaxed">إضافة شركات الشحن، مراجعة طلبات الانضمام، وتغيير الباقات. كل إجراء هنا يُسجَّل في سجل المنصة.</p>
  </div>
);

// Platform-admin area: its own login and session, never inside a tenant.
export default function PlatformApp() {
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setSessionLostHandler(() => setAdmin(null), "platform");
    platformMe()
      .catch(() => platformRefresh())
      .then((data) => setAdmin(data.admin))
      .catch(() => setAdmin(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) return <FullPageLoading />;
  if (!admin) return <PlatformLogin onLogin={setAdmin} />;
  if (admin.mustChangePassword) {
    return (
      <AuthShell title="اختر كلمة مرور جديدة" description="كلمة المرور الحالية مؤقتة وتُستخدم مرة واحدة." aside={ASIDE}>
        <ChangePasswordForm<PlatformAdmin>
          email={admin.email}
          submitLabel="حفظ والمتابعة"
          onSubmit={async (current, next) => (await platformChangePassword(current, next)).admin}
          onDone={(a) => setAdmin(a)}
        />
      </AuthShell>
    );
  }
  return (
    <PlatformConsole
      admin={admin}
      onLogout={async () => {
        await platformLogout().catch(() => {});
        setAdmin(null);
      }}
    />
  );
}

function PlatformLogin({ onLogin }: { onLogin(admin: PlatformAdmin): void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      onLogin((await platformLogin(email, password)).admin);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="دخول إدارة المنصة" description="هذا الدخول منفصل عن حسابات الشركات." aside={ASIDE}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="البريد الإلكتروني">{(p) => <Input {...p} type="email" dir="ltr" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />}</Field>
        <Field label="كلمة المرور">{(p) => <Input {...p} type="password" dir="ltr" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}</Field>
        {error && <Notice tone="danger">{error}</Notice>}
        <Button type="submit" size="lg" loading={loading} className="w-full">دخول</Button>
      </form>
    </AuthShell>
  );
}
