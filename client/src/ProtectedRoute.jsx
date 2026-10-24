import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, allow }) {
  const { user, checking } = useAuth();

  if (checking) {
    return <div className="w-full h-screen flex justify-center items-center bg-main text-white text-xl">جاري التحميل...</div>;
  }

  // لو مش عامل login
  if (!user) return <Navigate to="/login" />;

  // لو الدور مش مسموح
  if (allow && !allow.includes(user.role)) return <Navigate to="/" />;

  return children;
}
