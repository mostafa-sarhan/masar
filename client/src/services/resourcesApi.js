import { api, request } from "./api";

// Couriers
export const getCouriers = () => api("/couriers");
export const createCourier = (name) => api("/couriers", { method: "POST", body: { name } });

// Merchants
export const getMerchantOptions = () => api("/merchants/options");
export const getMerchants = () => api("/merchants");
// { merchant, apiKey } — the key is only ever returned here and on rotate
export const createMerchant = (name) => api("/merchants", { method: "POST", body: { name } });
// { name?, companyFee? (null = tenant default) }
export const updateMerchant = (id, changes) => api(`/merchants/${id}`, { method: "PATCH", body: changes });
export const rotateMerchantKey = (id) => api(`/merchants/${id}/api-key`, { method: "POST" });
export const revokeMerchantKey = (id) => api(`/merchants/${id}/api-key`, { method: "DELETE" });

// Settings
export const getSettings = () => api("/settings");
export const updateSettings = (changes) => api("/settings", { method: "PUT", body: changes });

// Users (admin)
export const getUsers = () => api("/users");
export const getAuditLogs = (params) => request("/users/audit-logs", { params });
export const createUser = (user) => api("/users", { method: "POST", body: user });
export const changePassword = (id, newPassword) => api(`/users/${id}/password`, { method: "PUT", body: { newPassword } });
export const changeRole = (id, role) => api(`/users/${id}/role`, { method: "PUT", body: { role } });

// Reports — all money is calculated on the server. Each returns { data, meta: { fees } }.
export const getSummaryReport = (params) => request("/reports/summary", { params });
export const getMerchantReport = (params) => request("/reports/merchants", { params });
export const getCourierReport = (params) => request("/reports/couriers", { params });
export const getSettlement = (orderIds, fees = {}) =>
  request("/reports/settlement", { method: "POST", body: { orderIds, ...fees } });
