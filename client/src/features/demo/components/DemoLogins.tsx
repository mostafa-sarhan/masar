import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bike, Briefcase, Crown, Store, UserCog, type LucideIcon } from "lucide-react";
import type { Role } from "@masar/shared";
import { useAuth } from "@/app/auth-context";
import { useFeedback } from "@/components/ui/feedback-context";
import { homeFor } from "@/lib/roles";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/cn";
import { useDemoInfo } from "../hooks/use-demo-info";

const ROLES: Record<Role, { label: string; text: string; Icon: LucideIcon }> = {
  owner: { label: "صاحب الشركة", text: "كل الشاشات والتقارير والإعدادات", Icon: Crown },
  admin: { label: "مدير", text: "التشغيل، التقارير، التجار والمناديب", Icon: UserCog },
  employee: { label: "موظف", text: "إدخال الشحنات وتسليمها للمناديب", Icon: Briefcase },
  courier: { label: "مندوب", text: "شحنات اليوم على الهاتف", Icon: Bike },
  merchant: { label: "تاجر", text: "بوابة التاجر وكشف الحساب", Icon: Store },
};

// Demo mode: sign in as any role of the demo company with one click.
export function DemoLogins({ className }: { className?: string }) {
  const info = useDemoInfo();
  const { demoLogin } = useAuth();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<Role | null>(null);
  if (!info?.enabled) return null;

  const go = async (role: Role) => {
    try {
      setBusy(role);
      const user = await demoLogin(role);
      navigate(homeFor(user.role));
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="demo-logins" className={cn("space-y-3", className)}>
      <h2 id="demo-logins" className="text-sm font-semibold text-ink">
        ادخل بدون حساب
      </h2>
      <ul className="grid gap-2">
        {info.roles.map((role) => {
          const { label, text, Icon } = ROLES[role];
          return (
            <li key={role}>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => go(role)}
                className="flex w-full items-center gap-3 rounded-md border border-rule bg-sheet px-3 py-2.5 text-start transition-colors hover:border-carbon hover:bg-carbon-soft disabled:opacity-60 cursor-pointer"
              >
                <Icon className="size-5 shrink-0 text-carbon" aria-hidden />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-sm font-medium text-ink">الدخول كـ{label}</span>
                  <span className="block text-xs text-ink-3">{text}</span>
                </span>
                {busy === role && <span className="size-4 animate-spin rounded-full border-2 border-rule border-t-carbon" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
