import { matchesSearch } from "@masar/shared";

export interface ComboOption {
  value: string;
  label: string;
  // Second line (e.g. the governorate under a city), also searched.
  hint?: string;
  // Extra words that should find this option (e.g. the English name).
  keywords?: string[];
}

// Options matching the query (Arabic-aware), capped at `max` so long lists stay fast.
export function filterOptions(options: ComboOption[], query: string, max = 100) {
  const matches = query.trim() ? options.filter((o) => matchesSearch(query, o.label, o.hint, ...(o.keywords ?? []))) : options;
  return { visible: matches.slice(0, max), hidden: Math.max(0, matches.length - max) };
}

// Keyboard movement through the list (wraps around); -1 means nothing active.
export function moveActive(current: number, key: string, count: number): number {
  if (!count) return -1;
  switch (key) {
    case "ArrowDown":
      return current < count - 1 ? current + 1 : 0;
    case "ArrowUp":
      return current > 0 ? current - 1 : count - 1;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return current;
  }
}

// Multi-select: add the value, or remove it when it's already selected.
export const toggleValue = (values: string[], value: string) => (values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
