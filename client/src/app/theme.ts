// Light / dark / system, saved per browser. public/theme-init.js applies it before first paint.
export type ThemeMode = "light" | "dark" | "system";
const KEY = "masar-theme";

export function getThemeMode(): ThemeMode {
  try {
    return (localStorage.getItem(KEY) as ThemeMode) || "system";
  } catch {
    return "system";
  }
}

export function applyTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* private mode: theme just isn't remembered */
  }
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}
