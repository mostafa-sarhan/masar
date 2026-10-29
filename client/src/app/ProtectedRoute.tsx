import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { Role } from "@masar/shared";
import { useAuth } from "./auth-context";
import ChangePasswordForm from "@/features/auth/components/ChangePasswordForm";
import { changeOwnPassword } from "@/features/auth/api/auth-api";
import { homeFor } from "@/lib/roles";

export default function ProtectedRoute({ children, allow }: { children: ReactNode; allow?: Role[] }) {
  const { user, checking, passwordChanged } = useAuth();

  if (checking) {
    return <div className="w-full h-screen flex justify-center items-center bg-main text-white text-xl">جاري التحميل...</div>;
  }

  // لو مش عامل login
  if (!user) return <Navigate to="/login" />;

  // باسورد مؤقت: لازم يتغير قبل استخدام النظام
  if (user.mustChangePassword) {
    return (
      <ChangePasswordForm
        title="غيّر الباسورد المؤقت"
        note="هذا الباسورد للاستخدام مرة واحدة. اختر باسورد خاص بك للمتابعة."
        onSubmit={async (current: string, next: string) => (await changeOwnPassword(current, next)).user}
        onDone={passwordChanged}
      />
    );
  }

  // لو الدور مش مسموح
  if (allow && !allow.includes(user.role)) return <Navigate to={homeFor(user.role)} />;

  return children;
}
