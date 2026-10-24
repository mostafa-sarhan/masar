export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(status, { code = "INTERNAL_ERROR", message = "Request failed", details, requestId } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

function buildUrl(path, params) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const qs = query.toString();
  return `${API_URL}${path}${qs ? `?${qs}` : ""}`;
}

async function send(path, { method = "GET", body, params } = {}) {
  const res = await fetch(buildUrl(path, params), {
    method,
    credentials: "include", // httpOnly session cookies
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.error);
  return json;
}

// One refresh at a time, shared by every request that hit an expired access token.
let refreshing = null;
const refreshSession = () => {
  refreshing ||= send("/auth/refresh", { method: "POST" }).finally(() => (refreshing = null));
  return refreshing;
};

let onSessionLost = () => {};
export const setSessionLostHandler = (handler) => (onSessionLost = handler);

// Full response: { data, meta? }. Retries once after refreshing an expired session.
export async function request(path, options) {
  try {
    return await send(path, options);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401 || path.startsWith("/auth/")) throw err;
    try {
      await refreshSession();
    } catch {
      onSessionLost();
      throw err;
    }
    return send(path, options);
  }
}

// Just the data.
export const api = async (path, options) => (await request(path, options)).data;
