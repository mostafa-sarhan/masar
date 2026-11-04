import { describe, expect, it } from "vitest";
import { filterOptions, moveActive, toggleValue, type ComboOption } from "./combobox-logic";

const cities: ComboOption[] = [
  { value: "C-NASR-CITY", label: "مدينة نصر", hint: "القاهرة", keywords: ["Nasr City"] },
  { value: "C-MAADI", label: "المعادي", hint: "القاهرة", keywords: ["Maadi"] },
  { value: "ALX-SMOUHA", label: "سموحة", hint: "الإسكندرية", keywords: ["Smouha"] },
];

describe("filterOptions", () => {
  it("matches Arabic spelling variants, hints and keywords", () => {
    expect(filterOptions(cities, "مدينه").visible.map((o) => o.value)).toEqual(["C-NASR-CITY"]);
    expect(filterOptions(cities, "الاسكندريه").visible.map((o) => o.value)).toEqual(["ALX-SMOUHA"]);
    expect(filterOptions(cities, "maadi").visible.map((o) => o.value)).toEqual(["C-MAADI"]);
    expect(filterOptions(cities, "قاهره").visible).toHaveLength(2);
  });

  it("returns everything for an empty query and caps long lists", () => {
    expect(filterOptions(cities, "  ").visible).toHaveLength(3);
    const many = Array.from({ length: 250 }, (_, i) => ({ value: String(i), label: `خيار ${i}` }));
    expect(filterOptions(many, "", 100)).toMatchObject({ hidden: 150 });
    expect(filterOptions(many, "", 100).visible).toHaveLength(100);
  });
});

describe("moveActive", () => {
  it("wraps around and jumps with Home / End", () => {
    expect(moveActive(-1, "ArrowDown", 3)).toBe(0);
    expect(moveActive(2, "ArrowDown", 3)).toBe(0);
    expect(moveActive(0, "ArrowUp", 3)).toBe(2);
    expect(moveActive(1, "Home", 3)).toBe(0);
    expect(moveActive(0, "End", 3)).toBe(2);
    expect(moveActive(1, "a", 3)).toBe(1);
    expect(moveActive(0, "ArrowDown", 0)).toBe(-1);
  });
});

describe("toggleValue", () => {
  it("adds and removes", () => {
    expect(toggleValue(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleValue(["a", "b"], "a")).toEqual(["b"]);
  });
});
