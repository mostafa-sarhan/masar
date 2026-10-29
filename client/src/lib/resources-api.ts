import type { UpdateSettingsInput, Role } from "@masar/shared";
import { api, request, type Params } from "./api-client";
import type { Courier, Merchant, UserRow, AuditEventRow, TenantSettings, Summary, ReportMeta, GroupedReportRow, PageMeta, SessionUser } from "./types";

// Couriers
export const getCouriers = () => api<Courier[]>("/couriers");
export const createCourier = (name: string) => api<Courier>("/couriers", { method: "POST", body: { name } });

// Merchants
export const getMerchantOptions = () => api<{ _id: string; name: string }[]>("/merchants/options");
export const getMerchants = () => api<Merchant[]>("/merchants");
// The API key is only ever returned here and on rotate.
export const createMerchant = (name: string) => api<{ merchant: Merchant; apiKey: string | null }>("/merchants", { method: "POST", body: { name } });
export const updateMerchant = (id: string, changes: { name?: string; companyFee?: number | null }) =>
  api<Merchant>(`/merchants/${id}`, { method: "PATCH", body: changes });
export const rotateMerchantKey = (id: string) => api<{ merchant: Merchant; apiKey: string }>(`/merchants/${id}/api-key`, { method: "POST" });
export const revokeMerchantKey = (id: string) => api<Merchant>(`/merchants/${id}/api-key`, { method: "DELETE" });

// Settings
export const getSettings = () => api<TenantSettings>("/settings");
export const updateSettings = (changes: UpdateSettingsInput) => api<TenantSettings>("/settings", { method: "PUT", body: changes });

// Users (owner/admin)
export const getUsers = () => api<UserRow[]>("/users");
export const getAuditLogs = (params: Params) => request<AuditEventRow[], PageMeta>("/users/audit-logs", { params });
export const createUser = (user: { email: string; password: string; role: Role }) => api<SessionUser>("/users", { method: "POST", body: user });
export const changePassword = (id: string, newPassword: string) => api<SessionUser>(`/users/${id}/password`, { method: "PUT", body: { newPassword } });
export const changeRole = (id: string, role: Role) => api<SessionUser>(`/users/${id}/role`, { method: "PUT", body: { role } });

// Reports: all money is calculated on the server.
export const getSummaryReport = (params: Params) => request<Summary, ReportMeta>("/reports/summary", { params });
export const getMerchantReport = (params: Params) => request<GroupedReportRow<"merchant">[], ReportMeta>("/reports/merchants", { params });
export const getCourierReport = (params: Params) => request<GroupedReportRow<"courier">[], ReportMeta>("/reports/couriers", { params });
export const getSettlement = (orderIds: string[], fees: { courierFee?: number } = {}) =>
  request<Summary, ReportMeta>("/reports/settlement", { method: "POST", body: { orderIds, ...fees } });
