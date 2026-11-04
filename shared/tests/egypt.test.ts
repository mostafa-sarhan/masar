import { describe, expect, it } from "vitest";
import { GOVERNORATES, getCity, getGovernorate, isCityOf, placeLabel } from "../src/geo/egypt";
import { findCity, findGovernorate } from "../src/geo/match";

describe("Egypt locations", () => {
  it("has the 27 governorates with unique codes and at least one city each", () => {
    expect(GOVERNORATES).toHaveLength(27);
    expect(new Set(GOVERNORATES.map((g) => g.code)).size).toBe(27);
    for (const g of GOVERNORATES) expect(g.cities.length).toBeGreaterThan(0);
  });

  it("has unique city codes, prefixed with their governorate", () => {
    const codes = GOVERNORATES.flatMap((g) => g.cities.map((c) => c.code));
    expect(new Set(codes).size).toBe(codes.length);
    for (const g of GOVERNORATES) for (const c of g.cities) expect(c.code.startsWith(`${g.code}-`)).toBe(true);
  });

  it("looks codes up", () => {
    expect(getGovernorate("ALX")?.en).toBe("Alexandria");
    expect(getCity("C-NASR-CITY")?.ar).toBe("مدينة نصر");
    expect(isCityOf("C-NASR-CITY", "C")).toBe(true);
    expect(isCityOf("C-NASR-CITY", "GZ")).toBe(false);
    expect(placeLabel("C", "C-MAADI")).toBe("المعادي، القاهرة");
  });
});

describe("matching names from imports", () => {
  it("finds governorates by Arabic (any spelling), English or code", () => {
    expect(findGovernorate("الاسكندريه")?.code).toBe("ALX");
    expect(findGovernorate("Alexandria")?.code).toBe("ALX");
    expect(findGovernorate("alx")?.code).toBe("ALX");
    expect(findGovernorate("قاهره")?.code).toBe("C");
    expect(findGovernorate("مكان غير موجود")).toBeUndefined();
  });

  it("finds cities inside a governorate, including aliases", () => {
    expect(findCity("C", "مدينه نصر")?.code).toBe("C-NASR-CITY");
    expect(findCity("GZ", "6 اكتوبر")?.code).toBe("GZ-6TH-OF-OCTOBER");
    expect(findCity("C", "التجمع")?.code).toBe("C-FIFTH-SETTLEMENT");
    expect(findCity("GZ", "مدينة نصر")).toBeUndefined(); // wrong governorate
  });
});
