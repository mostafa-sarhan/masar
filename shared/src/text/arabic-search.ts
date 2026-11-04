// Arabic-aware text matching for search boxes and Excel imports.
// "الإسكندريه" matches "الاسكندرية", "مدينه نصر" matches "مدينة نصر", diacritics and tatweel are ignored,
// and Arabic-Indic digits match Latin ones.

const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;
const FOLD: Record<string, string> = {
  أ: "ا",
  إ: "ا",
  آ: "ا",
  ٱ: "ا",
  ة: "ه",
  ى: "ي",
  ئ: "ي",
  ؤ: "و",
};
const FOLD_RX = new RegExp(`[${Object.keys(FOLD).join("")}]`, "g");
const ARABIC_DIGITS = /[٠-٩۰-۹]/g;

export function normalizeArabic(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .normalize("NFKC")
    .replace(DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(FOLD_RX, (c) => FOLD[c])
    .replace(ARABIC_DIGITS, (d) => String((d.charCodeAt(0) - 0x0660) % 0x90 % 10))
    .toLowerCase()
    .replace(/[\s‌‏‎_\-.,،]+/g, " ")
    .trim();
}

// The same text without a leading definite article on each word ("القاهرة" → "قاهره").
const withoutArticle = (normalized: string) =>
  normalized
    .split(" ")
    .map((w) => (w.length > 3 && w.startsWith("ال") ? w.slice(2) : w))
    .join(" ");

// Every word of the query appears in one of the fields (order doesn't matter).
export function matchesSearch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const words = normalizeArabic(query).split(" ").filter(Boolean);
  if (!words.length) return true;
  const haystack = fields.map((f) => normalizeArabic(f)).join(" ");
  const loose = withoutArticle(haystack);
  return words.every((w) => haystack.includes(w) || loose.includes(withoutArticle(w)));
}

// Two names refer to the same thing (exact after normalization, with or without "ال").
export function sameName(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = normalizeArabic(a);
  const y = normalizeArabic(b);
  if (!x || !y) return false;
  return x === y || withoutArticle(x) === withoutArticle(y);
}
