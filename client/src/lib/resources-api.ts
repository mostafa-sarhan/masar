import type { UpdateSettingsInput, Role, ZoneInput } from "@masar/shared";
import { api, request, type Params } from "./api-client";
import type { Courier, Merchant, Zone, ShippingQuote, UserRow, AuditEventRow, TenantSettings, Summary, ReportMeta, GroupedReportRow, PageMeta, SessionUser } from "./types";

// Couriers
export const getCouriers = () => api<Courier[]>("/couriers");
export const createCourier = (name: string) => api<Courier>("/couriers", { method: "POST", body: { name } });
// Searchable option lists for comboboxes: matches for `q`, or the names of the given ids.
type NamedRef = { _id: string; name: string };
const optionParams = ({ q, ids }: { q?: string; ids?: string[] }) => ({ q, ids: ids?.join(","), limit: 30 });
export const getCourierOptions = (p: { q?: string; ids?: string[] } = {}) => api<NamedRef[]>("/couriers/options", { params: optionParams(p) });

// Merchants
export const getMerchantOptions = (p: { q?: string; ids?: string[] } = {}) => api<NamedRef[]>("/merchants/options", { params: optionParams(p) });
export const getMerchants = () => api<Merchant[]>("/merchants");
// The API key is only ever returned here and on rotate.
export const createMerchant = (name: string) => api<{ merchant: Merchant; apiKey: string | null }>("/merchants", { method: "POST", body: { name } });
export const updateMerchant = (id: string, changes: { name?: string; companyFee?: number | null }) =>
  api<Merchant>(`/merchants/${id}`, { method: "PATCH", body: changes });
export const rotateMerchantKey = (id: string) => api<{ merchant: Merchant; apiKey: string }>(`/merchants/${id}/api-key`, { method: "POST" });
export const revokeMerchantKey = (id: string) => api<Merchant>(`/merchants/${id}/api-key`, { method: "DELETE" });

export const setMerchantZonePrices = (id: string, prices: { zone: string; price: number }[]) => api<Merchant>(`/merchants/${id}/zone-prices`, { method: "PUT", body: { prices } });

// Shipping zones
export const getZones = () => api<Zone[]>("/zones");
export const createZone = (zone: ZoneInput) => api<Zone>("/zones", { method: "POST", body: zone });
export const updateZone = (id: string, zone: ZoneInput) => api<Zone>(`/zones/${id}`, { method: "PUT", body: zone });
export const deleteZone = (id: string) => api<{ deleted: true }>(`/zones/${id}`, { method: "DELETE" });
export const quoteShipping = (params: { merchant?: string; governorate: string; city?: string }) => api<ShippingQuote>("/zones/quote", { params });

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
export const getZoneReport = (params: Params) => request<GroupedReportRow<"zone">[], ReportMeta>("/reports/zones", { params });
export const getGovernorateReport = (params: Params) => request<GroupedReportRow<"governorate">[], ReportMeta>("/reports/governorates", { params });
export const getSettlement = (orderIds: string[], fees: { courierFee?: number } = {}) =>
  request<Summary, ReportMeta>("/reports/settlement", { method: "POST", body: { orderIds, ...fees } });
