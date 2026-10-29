// API error codes -> Arabic messages.
const MESSAGES = {
  VALIDATION_ERROR: "البيانات غير صحيحة",
  INVALID_ID: "معرّف غير صحيح",
  UNAUTHENTICATED: "يجب تسجيل الدخول",
  INVALID_CREDENTIALS: "الإيميل أو الباسورد غير صحيح",
  SESSION_EXPIRED: "انتهت الجلسة، سجّل الدخول مرة أخرى",
  FORBIDDEN: "ليس لديك صلاحية لهذا الإجراء",
  FORBIDDEN_FIELDS: "ليس لديك صلاحية لتعديل هذه الحقول",
  CSRF_REJECTED: "تم رفض الطلب",
  NOT_FOUND: "غير موجود",
  CONFLICT: "تم تعديل الطلب من مستخدم آخر، حدّث الصفحة وحاول مرة أخرى",
  DUPLICATE: "موجود بالفعل",
  INVALID_STATUS_TRANSITION: "لا يمكن تغيير الحالة بهذا الشكل",
  WEAK_PASSWORD: "الباسورد ضعيف: 10 أحرف على الأقل وتحتوي على حروف وأرقام",
  LAST_ADMIN: "لا يمكنك تغيير صلاحيتك أنت",
  LAST_OWNER: "يجب أن يبقى مالك واحد على الأقل",
  TENANT_SUSPENDED: "تم إيقاف حساب الشركة، تواصل مع الدعم",
  TRIAL_EXPIRED: "انتهت الفترة التجريبية، تواصل معنا للاشتراك",
  PLAN_LIMIT_REACHED: "تم الوصول إلى حد الباقة الحالية",
  RATE_LIMITED: "محاولات كثيرة، حاول بعد قليل",
  PAYLOAD_TOO_LARGE: "البيانات كبيرة جدًا",
  INTERNAL_ERROR: "حدث خطأ في السيرفر",
};

export function errorMessage(err) {
  if (!err?.code) return err?.message === "Failed to fetch" ? "تعذر الاتصال بالسيرفر" : MESSAGES.INTERNAL_ERROR;
  const base = MESSAGES[err.code] || MESSAGES.INTERNAL_ERROR;
  // Bulk actions list the orders that couldn't be changed.
  if (Array.isArray(err.details) && err.details[0]?.barcode) {
    return `${base}:\n${err.details.map((d) => `${d.barcode}: ${MESSAGES[d.code] || d.message}`).join("\n")}`;
  }
  return base;
}
