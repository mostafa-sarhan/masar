import { GOVERNORATES, getGovernorate, type City, type Governorate } from "./egypt";
import { sameName } from "../text/arabic-search";

// Other names people commonly write for a place (matched with the same Arabic-aware rules).
const ALIASES: Record<string, string[]> = {
  C: ["مصر", "Cairo Governorate"],
  ALX: ["اسكندرية", "إسكندرية", "Alex"],
  GZ: ["جيزة"],
  "C-FIFTH-SETTLEMENT": ["التجمع", "التجمع الخامس الجديد", "5th Settlement"],
  "C-NEW-ADMINISTRATIVE-CAPITAL": ["العاصمة الإدارية", "New Capital"],
  "GZ-6TH-OF-OCTOBER": ["6 أكتوبر", "أكتوبر", "مدينة 6 أكتوبر", "6 October", "October"],
  "GZ-HARAM": ["الهرم", "Pyramids"],
  "SHR-10TH-OF-RAMADAN": ["العاشر", "مدينة العاشر من رمضان", "10th Ramadan"],
  "C-15TH-OF-MAY-CITY": ["15 مايو", "15 May"],
  "JS-SHARM-EL-SHEIKH": ["شرم", "Sharm"],
};

const names = (code: string, ar: string, en: string) => [code, ar, en, ...(ALIASES[code] ?? [])];

// The governorate a free-text name (Arabic, English or code) refers to.
export function findGovernorate(name: string | null | undefined): Governorate | undefined {
  if (!name?.trim()) return undefined;
  return GOVERNORATES.find((g) => names(g.code, g.ar, g.en).some((n) => sameName(n, name)));
}

// The city with this name inside a governorate.
export function findCity(governorate: string, name: string | null | undefined): City | undefined {
  if (!name?.trim()) return undefined;
  return getGovernorate(governorate)?.cities.find((c) => names(c.code, c.ar, c.en).some((n) => sameName(n, name)));
}
