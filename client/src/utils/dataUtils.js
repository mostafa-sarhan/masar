import { displayTimezone } from "./locale";

// dd-mm-yyyy in the tenant's timezone. Old non-ISO values are shown as they are.
export function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: displayTimezone(), day: "2-digit", month: "2-digit", year: "numeric" })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  return `${parts.day}-${parts.month}-${parts.year}`;
}
