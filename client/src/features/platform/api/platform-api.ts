import type { Plan, TenantStatus } from "@masar/shared";
import { api, request, type Params } from "@/lib/api-client";
import type { TenantRow, AccessRequestRow, PlatformAuditRow, PageMeta } from "@/lib/types";

export interface PlatformAdmin {
  id: string;
  email: string;
  mustChangePassword?: boolean;
}
type OwnerCredentials = { tenant: TenantRow; owner: { email: string }; initialPassword: string };

export const platformLogin = (email: string, password: string) => api<{ admin: PlatformAdmin }>("/platform/auth/login", { method: "POST", body: { email, password } });
export const platformLogout = () => api<{ loggedOut: true }>("/platform/auth/logout", { method: "POST" });
export const platformMe = () => api<{ admin: PlatformAdmin }>("/platform/auth/me");
export const platformRefresh = () => api<{ admin: PlatformAdmin }>("/platform/auth/refresh", { method: "POST" });
export const platformChangePassword = (currentPassword: string, newPassword: string) =>
  api<{ admin: PlatformAdmin }>("/platform/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });

export const getTenants = (params: Params) => request<TenantRow[], PageMeta>("/platform/tenants", { params });
// The owner's initial password is only returned here.
export const createTenant = (body: { name: string; ownerEmail: string; plan: Plan }) => api<OwnerCredentials>("/platform/tenants", { method: "POST", body });
export const updateTenant = (id: string, body: { plan?: Plan; status?: TenantStatus; name?: string }) => api<TenantRow>(`/platform/tenants/${id}`, { method: "PATCH", body });

export const getAccessRequests = (params: Params) => request<AccessRequestRow[], PageMeta>("/platform/access-requests", { params });
export const approveAccessRequest = (id: string, body: { plan?: Plan } = {}) => api<OwnerCredentials>(`/platform/access-requests/${id}/approve`, { method: "POST", body });
export const rejectAccessRequest = (id: string, reason?: string) =>
  api<AccessRequestRow>(`/platform/access-requests/${id}/reject`, { method: "POST", body: reason ? { reason } : {} });

export const getPlatformAuditLogs = (params: Params) => request<PlatformAuditRow[], PageMeta>("/platform/audit-logs", { params });
