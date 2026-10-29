// Tenant display preferences (timezone, currency), set once after login by AuthProvider.
// Arabic text with Latin digits, matching phones, barcodes and amounts typed by users.
export const LOCALE = "ar-EG-u-nu-latn";

const prefs = { timezone: "Africa/Cairo", currency: "EGP" };

export function setDisplayPrefs({ timezone, currency }: { timezone?: string; currency?: string } = {}) {
  if (timezone) prefs.timezone = timezone;
  if (currency) prefs.currency = currency;
}

export const displayTimezone = () => prefs.timezone;

// Amount in the tenant's currency, Arabic locale.
export function formatMoney(value: number | string | null | undefined) {
  const n = Number(value) || 0;
  try {
    return new Intl.NumberFormat(LOCALE, { style: "currency", currency: prefs.currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${n} ${prefs.currency}`;
  }
}
