import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allow }) {
  // تجيب اليوزر من localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  // لو مش عامل login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // لو الدور مش مسموح
  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/login" />;
  }

  // لو كل شيء تمام
  return children;
}
