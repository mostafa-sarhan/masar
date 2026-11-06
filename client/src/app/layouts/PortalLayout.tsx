import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { DemoBanner } from "@/features/demo/components/DemoBanner";

// Shell for the courier view and the merchant portal: no staff navigation, just company, account and sign out.
export default function PortalLayout({ title, children, narrow }: { title: string; children: ReactNode; narrow?: boolean }) {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh">
      {tenant?.demo && <DemoBanner />}
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/90 backdrop-blur">
        <div className={cn("mx-auto flex h-14 items-center gap-3 px-4", narrow ? "max-w-xl" : "max-w-6xl")}>
          <Logo className="text-ink" subtitle={tenant?.name} />
          <div className="ms-auto flex items-center gap-1">
            <span className="hidden text-sm text-ink-2 sm:inline">{user?.email}</span>
            <ThemeToggle className="text-ink-2" />
            <Button
              variant="quiet"
              size="sm"
              icon={<LogOut className="size-4" />}
              aria-label="تسجيل الخروج"
              title="تسجيل الخروج"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
            />
          </div>
        </div>
      </header>
      <main className={cn("mx-auto px-4 py-6", narrow ? "max-w-xl" : "max-w-6xl")}>
        <h1 className="mb-5 text-2xl font-semibold text-ink">{title}</h1>
        {children}
      </main>
    </div>
  );
}
