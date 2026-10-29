import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Role } from "@masar/shared";
import { useAuth } from "./auth-context";
import ChangePasswordForm from "@/features/auth/components/ChangePasswordForm";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { changeOwnPassword } from "@/features/auth/api/auth-api";
import { homeFor } from "@/lib/roles";

export function FullPageLoading() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-label="جارٍ التحميل">
      <div className="size-8 animate-spin rounded-full border-2 border-rule border-t-carbon" />
    </div>
  );
}

// Signed in, password set, and allowed for this role.
export default function ProtectedRoute({ children, allow, guestRedirect = "/login" }: { children: ReactNode; allow?: Role[]; guestRedirect?: string }) {
  const { user, checking, passwordChanged } = useAuth();
  const location = useLocation();

  if (checking) return <FullPageLoading />;
  if (!user) return <Navigate to={guestRedirect} replace state={{ from: location.pathname }} />;

  // One-time password: it must be replaced before anything else.
  if (user.mustChangePassword) {
    return (
      <AuthShell title="اختر كلمة مرور جديدة" description="كلمة المرور الحالية مؤقتة وتُستخدم مرة واحدة. اختر كلمة مرور خاصة بك للمتابعة.">
        <ChangePasswordForm email={user.email} submitLabel="حفظ والمتابعة" onSubmit={async (current, next) => (await changeOwnPassword(current, next)).user} onDone={passwordChanged} />
      </AuthShell>
    );
  }

  if (allow && !allow.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
