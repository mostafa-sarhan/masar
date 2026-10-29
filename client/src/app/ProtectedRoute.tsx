import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import ChangePasswordForm from "./ChangePasswordForm";
import { changeOwnPassword } from "./services/authService";
import { homeFor } from "./utils/roles";

export default function ProtectedRoute({ children, allow }) {
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
        onSubmit={async (current, next) => (await changeOwnPassword(current, next)).user}
        onDone={passwordChanged}
      />
    );
  }

  // لو الدور مش مسموح
  if (allow && !allow.includes(user.role)) return <Navigate to={homeFor(user.role)} />;

  return children;
}
