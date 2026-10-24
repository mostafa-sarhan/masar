import { Navigate } from "react-router-dom";
import { getUser, getToken } from "./services/session";

export default function ProtectedRoute({ children, allow }) {
  const user = getUser();

  // لو مش عامل login
  if (!user || !getToken()) {
    return <Navigate to="/login" />;
  }

  // لو الدور مش مسموح
  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/" />;
  }

  // لو كل شيء تمام
  return children;
}
