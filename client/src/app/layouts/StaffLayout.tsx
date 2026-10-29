import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Menu, Search, LogOut, KeyRound, X } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { NAV_GROUPS } from "@/app/navigation";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { useFeedback } from "@/components/ui/feedback-context";
import ChangePasswordForm from "@/features/auth/components/ChangePasswordForm";
import { changeOwnPassword } from "@/features/auth/api/auth-api";
import { CommandPalette } from "./CommandPalette";
import { isAdmin as isAdminRole, ROLE_LABELS } from "@/lib/roles";
import { cn } from "@/lib/cn";

function SideNav({ admin, onNavigate }: { admin: boolean; onNavigate?(): void }) {
  return (
    <nav aria-label="القائمة الرئيسية" className="space-y-6">
      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((i) => !i.adminOnly || admin);
        if (!items.length) return null;
        return (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-2xs text-rail-muted">{group.label}</p>
            <ul className="space-y-0.5">
              {items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === "/" || to === "/orders"}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive ? "bg-white/10 text-white shadow-[inset_-3px_0_0_var(--c-tape)]" : "text-rail-ink hover:bg-white/5"
                      )
                    }
                  >
                    <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

// Staff app shell: navy rail with the navigation, top bar with search, theme and account.
export default function StaffLayout() {
  const { user, tenant, logout, passwordChanged } = useAuth();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const admin = isAdminRole(user?.role);
  const [mobileNav, setMobileNav] = useState(false);
  const [palette, setPalette] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const signOut = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
      {/* Rail (desktop) */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto bg-rail px-3 py-5 text-rail-ink lg:flex">
        <Logo subtitle={tenant?.name} className="px-2 text-white" />
        <SideNav admin={admin} />
        <div className="mt-auto space-y-3 px-2">
          <ThemeToggle className="text-rail-ink" />
        </div>
      </aside>

      {/* Mobile navigation drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-scrim" onClick={() => setMobileNav(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-72 flex-col gap-6 overflow-y-auto bg-rail px-3 py-5 text-rail-ink">
            <div className="flex items-center justify-between">
              <Logo subtitle={tenant?.name} className="px-2 text-white" />
              <Button variant="quiet" size="sm" className="text-rail-ink hover:bg-white/10" onClick={() => setMobileNav(false)} icon={<X className="size-4" />} aria-label="إغلاق القائمة" />
            </div>
            <SideNav admin={admin} onNavigate={() => setMobileNav(false)} />
            <ThemeToggle className="mt-auto ms-2 text-rail-ink" />
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-rule bg-paper/90 px-4 backdrop-blur lg:px-8">
          <Button variant="quiet" size="sm" className="lg:hidden" onClick={() => setMobileNav(true)} icon={<Menu className="size-5" />} aria-label="فتح القائمة" />
          <button
            onClick={() => setPalette(true)}
            className="flex h-9 flex-1 items-center gap-2 rounded-md border border-rule bg-sheet px-3 text-sm text-ink-3 transition-colors hover:border-ink-3 md:max-w-sm cursor-pointer"
          >
            <Search className="size-4" aria-hidden />
            <span className="truncate">بحث سريع أو رقم شحنة</span>
            <kbd className="ms-auto hidden rounded border border-rule px-1.5 text-2xs md:inline" dir="ltr">
              Ctrl K
            </kbd>
          </button>
          <div className="ms-auto flex items-center gap-1">
            <div className="hidden text-end leading-tight sm:block">
              <div className="text-sm text-ink">{user?.email}</div>
              <div className="text-2xs text-ink-3">{user && ROLE_LABELS[user.role]}</div>
            </div>
            <Button variant="quiet" size="sm" onClick={() => setPasswordOpen(true)} icon={<KeyRound className="size-4" />} aria-label="تغيير كلمة المرور" title="تغيير كلمة المرور" />
            <Button variant="quiet" size="sm" onClick={signOut} icon={<LogOut className="size-4" />} aria-label="تسجيل الخروج" title="تسجيل الخروج" />
          </div>
        </header>
        <main className="mx-auto max-w-[84rem] px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} isAdmin={admin} />
      <Modal open={passwordOpen} onClose={() => setPasswordOpen(false)} title="تغيير كلمة المرور" description="سيتم تسجيل خروجك من الأجهزة الأخرى.">
        <ChangePasswordForm
          email={user?.email}
          onSubmit={async (current, next) => (await changeOwnPassword(current, next)).user}
          onDone={(u) => {
            passwordChanged(u);
            setPasswordOpen(false);
            toast("تم تغيير كلمة المرور");
          }}
        />
      </Modal>
    </div>
  );
}
