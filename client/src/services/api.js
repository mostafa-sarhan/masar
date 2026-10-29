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

// Two session realms: tenant users and platform admins (paths under /platform).
const realmOf = (path) => (path.startsWith("/platform") ? "platform" : "tenant");
const REFRESH_PATH = { tenant: "/auth/refresh", platform: "/platform/auth/refresh" };
const AUTH_PREFIX = { tenant: "/auth/", platform: "/platform/auth/" };

// One refresh at a time per realm, shared by every request that hit an expired access token.
const refreshing = {};
const refreshSession = (realm) => {
  refreshing[realm] ||= send(REFRESH_PATH[realm], { method: "POST" }).finally(() => (refreshing[realm] = null));
  return refreshing[realm];
};

const ACCOUNT_BLOCKED = ["TENANT_SUSPENDED", "TRIAL_EXPIRED"];
const onSessionLost = { tenant: () => {}, platform: () => {} };
export const setSessionLostHandler = (handler, realm = "tenant") => (onSessionLost[realm] = handler);

// Full response: { data, meta? }. Retries once after refreshing an expired session.
export async function request(path, options) {
  const realm = realmOf(path);
  try {
    return await send(path, options);
  } catch (err) {
    // The company was suspended or its trial ended while the app was open: end the session.
    if (err instanceof ApiError && ACCOUNT_BLOCKED.includes(err.code)) {
      onSessionLost[realm](err);
      throw err;
    }
    if (!(err instanceof ApiError) || err.status !== 401 || path.startsWith(AUTH_PREFIX[realm])) throw err;
    try {
      await refreshSession(realm);
    } catch {
      onSessionLost[realm]();
      throw err;
    }
    return send(path, options);
  }
}

// Just the data.
export const api = async (path, options) => (await request(path, options)).data;
