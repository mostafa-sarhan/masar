import { displayTimezone } from "./locale";

// dd-mm-yyyy in the tenant's timezone. Values that aren't dates are shown as they are.
export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: displayTimezone(), day: "2-digit", month: "2-digit", year: "numeric" })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  return `${parts.day}-${parts.month}-${parts.year}`;
}

export const formatDateTime = (value: string | Date) =>
  new Date(value).toLocaleString("ar-EG", { timeZone: displayTimezone(), dateStyle: "medium", timeStyle: "short" });
