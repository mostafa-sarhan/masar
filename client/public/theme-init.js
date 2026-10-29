// Applies the saved (or system) colour theme before the first paint, so there is no flash.
(function () {
  var mode = "system";
  try {
    mode = localStorage.getItem("masar-theme") || "system";
  } catch {
    // Storage blocked (private mode): fall back to the system theme.
  }
  var dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
})();
