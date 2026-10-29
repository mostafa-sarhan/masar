import { errorMessage } from "../services/errors";

// Asks for an email + one-time password and calls create(email, password). Phase E replaces the prompts with a form.
export async function promptAccount(label, create) {
  const email = window.prompt(`إيميل الدخول لـ ${label}`);
  if (!email) return false;
  const password = window.prompt("باسورد مؤقت (10 أحرف على الأقل، حروف وأرقام) — سيُطلب تغييره عند أول دخول");
  if (!password) return false;
  try {
    await create(email.trim(), password);
    alert(`تم إنشاء الحساب ✅\n${email}`);
    return true;
  } catch (err) {
    alert(errorMessage(err));
    return false;
  }
}
