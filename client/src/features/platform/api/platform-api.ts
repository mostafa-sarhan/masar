import { api, request } from "./api";

export const platformLogin = (email, password) => api("/platform/auth/login", { method: "POST", body: { email, password } });
export const platformLogout = () => api("/platform/auth/logout", { method: "POST" });
export const platformMe = () => api("/platform/auth/me");
export const platformRefresh = () => api("/platform/auth/refresh", { method: "POST" });
export const platformChangePassword = (currentPassword, newPassword) =>
  api("/platform/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });

export const getTenants = (params) => request("/platform/tenants", { params });
// { tenant, owner, initialPassword } — the password is only returned here
export const createTenant = (body) => api("/platform/tenants", { method: "POST", body });
export const updateTenant = (id, body) => api(`/platform/tenants/${id}`, { method: "PATCH", body });

export const getAccessRequests = (params) => request("/platform/access-requests", { params });
export const approveAccessRequest = (id, body = {}) => api(`/platform/access-requests/${id}/approve`, { method: "POST", body });
export const rejectAccessRequest = (id, reason) => api(`/platform/access-requests/${id}/reject`, { method: "POST", body: reason ? { reason } : {} });

export const getPlatformAuditLogs = (params) => request("/platform/audit-logs", { params });
