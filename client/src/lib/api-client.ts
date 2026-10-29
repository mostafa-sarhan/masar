import type { ApiErrorBody, ErrorCode } from "@masar/shared";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code: ErrorCode;
  details?: unknown;
  requestId?: string;
  constructor(status: number, body?: ApiErrorBody["error"]) {
    super(body?.message ?? "Request failed");
    this.status = status;
    this.code = body?.code ?? "INTERNAL_ERROR";
    this.details = body?.details;
    this.requestId = body?.requestId;
  }
}

export type Params = Record<string, string | number | boolean | null | undefined>;
export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Params;
}

function buildUrl(path: string, params?: Params) {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const qs = query.toString();
  return `${API_URL}${path}${qs ? `?${qs}` : ""}`;
}

// JSON by default; FormData bodies are sent as multipart; `raw` returns the Blob (downloads).
async function send(path: string, { method = "GET", body, params }: RequestOptions = {}, raw = false): Promise<unknown> {
  const isForm = body instanceof FormData;
  const res = await fetch(buildUrl(path, params), {
    method,
    credentials: "include", // httpOnly session cookies
    headers: body === undefined || isForm ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  if (raw && res.ok) return res.blob();
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, (json as ApiErrorBody | null)?.error);
  return json;
}

// Two session realms: tenant users and platform admins (paths under /platform).
type Realm = "tenant" | "platform";
const realmOf = (path: string): Realm => (path.startsWith("/platform") ? "platform" : "tenant");
const REFRESH_PATH: Record<Realm, string> = { tenant: "/auth/refresh", platform: "/platform/auth/refresh" };
const AUTH_PREFIX: Record<Realm, string> = { tenant: "/auth/", platform: "/platform/auth/" };
const ACCOUNT_BLOCKED: ErrorCode[] = ["TENANT_SUSPENDED", "TRIAL_EXPIRED"];

// One refresh at a time per realm, shared by every request that hit an expired access token.
const refreshing: Partial<Record<Realm, Promise<unknown> | null>> = {};
const refreshSession = (realm: Realm) => {
  refreshing[realm] ||= send(REFRESH_PATH[realm], { method: "POST" }).finally(() => (refreshing[realm] = null));
  return refreshing[realm]!;
};

type SessionLostHandler = (err?: ApiError) => void;
const onSessionLost: Record<Realm, SessionLostHandler> = { tenant: () => {}, platform: () => {} };
export const setSessionLostHandler = (handler: SessionLostHandler, realm: Realm = "tenant") => (onSessionLost[realm] = handler);

async function withSession<T>(path: string, run: () => Promise<T>): Promise<T> {
  const realm = realmOf(path);
  try {
    return await run();
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
    return run();
  }
}

// Full response: { data, meta }. `M` is the meta the endpoint always sends (paging, fees...).
// Retries once after refreshing an expired session.
export const request = <T, M = Record<string, unknown>>(path: string, options?: RequestOptions) =>
  withSession(path, () => send(path, options) as Promise<{ data: T; meta: M }>);

// Just the data.
export const api = async <T>(path: string, options?: RequestOptions) => (await request<T>(path, options)).data;

// Downloads a file from the API (with the session) and saves it as `fileName`.
export async function downloadFile(path: string, fileName: string) {
  const blob = (await withSession(path, () => send(path, {}, true))) as Blob;
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), { href: url, download: fileName }).click();
  URL.revokeObjectURL(url);
}
