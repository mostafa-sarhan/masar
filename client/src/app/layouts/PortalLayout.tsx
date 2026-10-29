import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/auth-context";

// Minimal shell for the courier view and the merchant portal (no staff sidebar).
export default function PortalLayout({ title, children }: { title: string; children: ReactNode }) {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-main text-white">
      <header className="flex justify-between items-center p-4 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm opacity-80">{tenant?.name} · {user?.email}</p>
        </div>
        <button
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
          className="bg-red-600 px-3 py-1 rounded"
        >
          خروج
        </button>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
