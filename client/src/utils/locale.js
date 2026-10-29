// Tenant display preferences (timezone, currency), set once after login by AuthContext.
const prefs = { timezone: "Africa/Cairo", currency: "EGP" };

export function setDisplayPrefs({ timezone, currency } = {}) {
  if (timezone) prefs.timezone = timezone;
  if (currency) prefs.currency = currency;
}

export const displayTimezone = () => prefs.timezone;

// 1234.5 -> "١٬٢٣٤٫٥٠ ج.م." style, in the tenant's currency.
export function formatMoney(value) {
  const n = Number(value) || 0;
  try {
    return new Intl.NumberFormat("ar-EG", { style: "currency", currency: prefs.currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${n} ${prefs.currency}`;
  }
}
