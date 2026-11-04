import { describe, expect, it } from "vitest";
import { matchesSearch, normalizeArabic, sameName } from "../src/text/arabic-search";

describe("normalizeArabic", () => {
  it("folds hamza forms, taa marbuta and alif maqsura", () => {
    expect(normalizeArabic("أإآا")).toBe("اااا");
    expect(normalizeArabic("مدينة")).toBe(normalizeArabic("مدينه"));
    expect(normalizeArabic("مصطفى")).toBe(normalizeArabic("مصطفي"));
  });

  it("drops diacritics and tatweel, maps Arabic-Indic digits, lowercases Latin", () => {
    expect(normalizeArabic("مُحَمَّد")).toBe("محمد");
    expect(normalizeArabic("الـقـاهـرة")).toBe(normalizeArabic("القاهرة"));
    expect(normalizeArabic("٠١٢٣٤٥٦٧٨٩ ۱۲")).toBe("0123456789 12");
    expect(normalizeArabic("  Nasr   CITY ")).toBe("nasr city");
  });

  it("handles empty input", () => {
    expect(normalizeArabic(undefined)).toBe("");
    expect(normalizeArabic("")).toBe("");
  });
});

describe("matchesSearch", () => {
  it("matches every query word in any field, in any order", () => {
    expect(matchesSearch("نصر مدينه", "مدينة نصر")).toBe(true);
    expect(matchesSearch("nasr", "مدينة نصر", "Nasr City")).toBe(true);
    expect(matchesSearch("الاسكندريه", "الإسكندرية")).toBe(true);
    expect(matchesSearch("اسكندرية", "الإسكندرية")).toBe(true);
    expect(matchesSearch("طنطا", "المنصورة")).toBe(false);
  });

  it("an empty query matches everything", () => {
    expect(matchesSearch("  ", "anything")).toBe(true);
  });
});

describe("sameName", () => {
  it("is exact after normalization, with or without the article", () => {
    expect(sameName("القاهره", "القاهرة")).toBe(true);
    expect(sameName("قاهرة", "القاهرة")).toBe(true);
    expect(sameName("القاهرة الجديدة", "القاهرة")).toBe(false);
    expect(sameName("", "القاهرة")).toBe(false);
  });
});
