// utils/dateUtils.js

/**
 * تحويل تاريخ بصيغة ISO أو قديمة (string) إلى شكل dd-mm-yyyy
 * @param {string} dateString
 * @returns {string} التاريخ بالشكل dd-mm-yyyy أو نفس القيمة لو مش قابل للتحويل
 */
export function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date)) return dateString; // لو التاريخ قديم ومش ISO، نعرضه زي ما هو

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
}
