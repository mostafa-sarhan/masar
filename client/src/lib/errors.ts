import type { ErrorCode } from "@masar/shared";
import { ApiError } from "./api-client";

// API error codes -> Arabic messages.
const MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "البيانات غير صحيحة",
  INVALID_ID: "معرّف غير صحيح",
  UNAUTHENTICATED: "يجب تسجيل الدخول",
  INVALID_CREDENTIALS: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  SESSION_EXPIRED: "انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى",
  FORBIDDEN: "ليس لديك صلاحية لهذا الإجراء",
  FORBIDDEN_FIELDS: "ليس لديك صلاحية لتعديل هذه الحقول",
  CSRF_REJECTED: "تم رفض الطلب",
  NOT_FOUND: "العنصر غير موجود",
  CONFLICT: "عدّل مستخدم آخر هذه البيانات، حدّث الصفحة وحاول مرة أخرى",
  DUPLICATE: "موجود بالفعل",
  INVALID_STATUS_TRANSITION: "لا يمكن تغيير الحالة بهذا الشكل",
  WEAK_PASSWORD: "كلمة المرور ضعيفة: 10 أحرف على الأقل وتحتوي على حروف وأرقام",
  LAST_ADMIN: "لا يمكنك تغيير صلاحيتك",
  LAST_OWNER: "يجب أن يبقى مالك واحد على الأقل",
  TENANT_SUSPENDED: "تم إيقاف حساب الشركة، تواصل مع الدعم",
  TRIAL_EXPIRED: "انتهت الفترة التجريبية، تواصل معنا للاشتراك",
  PLAN_LIMIT_REACHED: "تم الوصول إلى حد الباقة الحالية",
  PASSWORD_CHANGE_REQUIRED: "يجب تغيير كلمة المرور أولًا",
  INVALID_FILE: "الملف غير صالح",
  IMPORT_INVALID: "الملف يحتوي على أخطاء، لم يُستورد شيء",
  RATE_LIMITED: "محاولات كثيرة، حاول بعد قليل",
  PAYLOAD_TOO_LARGE: "حجم البيانات أكبر من المسموح",
  ZONE_OVERLAP: "بعض الأماكن تابعة لمنطقة أخرى بالفعل",
  SHIPPING_FEE_LOCKED: "لا يمكن تعديل سعر الشحن بعد تسليم الشحنة",
  DEMO_DISABLED: "هذا الإجراء غير متاح في النسخة التجريبية",
  INTERNAL_ERROR: "حدث خطأ في الخادم",
};

export function errorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return err instanceof Error && err.message === "Failed to fetch" ? "تعذّر الاتصال بالخادم" : MESSAGES.INTERNAL_ERROR;
  // The server's 429 message is already Arabic and includes the wait time.
  if (err.code === "RATE_LIMITED" && err.message) return err.message;
  const base = MESSAGES[err.code] ?? MESSAGES.INTERNAL_ERROR;
  // Bulk actions list the orders that couldn't be changed.
  const details = err.details as { barcode?: string; code?: ErrorCode; message?: string }[] | undefined;
  if (Array.isArray(details) && details[0]?.barcode) {
    return `${base}:\n${details.map((d) => `${d.barcode}: ${(d.code && MESSAGES[d.code]) || d.message}`).join("\n")}`;
  }
  return base;
}
