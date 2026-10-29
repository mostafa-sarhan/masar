import { useEffect, useState, type FormEvent } from "react";
import { platformLogin, platformLogout, platformMe, platformRefresh } from "@/features/platform/api/platform-api";
import { setSessionLostHandler } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import PlatformConsole from "./PlatformConsole";
import ChangePasswordForm from "@/features/auth/components/ChangePasswordForm";
import { platformChangePassword, type PlatformAdmin } from "@/features/platform/api/platform-api";

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

  if (checking) return <div className="w-full h-screen flex justify-center items-center bg-main text-white text-xl">جاري التحميل...</div>;
  if (!admin) return <PlatformLogin onLogin={setAdmin} />;
  if (admin.mustChangePassword) {
    return (
      <ChangePasswordForm
        title="غيّر الباسورد المؤقت"
        note="باسورد مُولّد للاستخدام مرة واحدة."
        onSubmit={async (current: string, next: string) => (await platformChangePassword(current, next)).admin}
        onDone={setAdmin}
      />
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

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      onLogin((await platformLogin(email, password)).admin);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="w-full flex justify-center items-center h-screen bg-main">
      <form onSubmit={submit} className="bg-amber-50 rounded-lg text-center p-4 m-2 flex flex-col text-black">
        <h1 className="text-xl font-bold mb-2">إدارة المنصة</h1>
        <label>الايميل</label>
        <input type="email" className="border p-1 rounded-lg my-2 w-[300px]" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>الباسورد</label>
        <input type="password" className="border p-1 rounded-lg my-2 w-[300px]" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" className="bg-black text-white rounded-lg py-1 mt-3">Login</button>
      </form>
    </div>
  );
}
