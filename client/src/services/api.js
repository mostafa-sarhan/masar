import { getToken, clearSession } from "./session";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

function buildUrl(path, params) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const qs = query.toString();
  return `${API_URL}${path}${qs ? `?${qs}` : ""}`;
}

// JSON request to the API with the stored token. Throws Error(message) on failure.
export async function api(path, { method = "GET", body, params } = {}) {
  const token = getToken();
  const res = await fetch(buildUrl(path, params), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Expired or invalid session: send the user back to login.
    if (res.status === 401 && token) {
      clearSession();
      window.location.hash = "#/login";
    }
    throw new Error(data?.message || `حدث خطأ في السيرفر: ${res.status}`);
  }

  return data;
}
