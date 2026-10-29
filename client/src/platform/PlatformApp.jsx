import { useEffect, useState } from "react";
import { platformLogin, platformLogout, platformMe, platformRefresh } from "../services/platformApi";
import { setSessionLostHandler } from "../services/api";
import { errorMessage } from "../services/errors";
import PlatformConsole from "./PlatformConsole";

// Platform-admin area: its own login and session, never inside a tenant.
export default function PlatformApp() {
  const [admin, setAdmin] = useState(null);
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

function PlatformLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
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
