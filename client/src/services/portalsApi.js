import { api, request } from "./api";

// Courier mobile view
export const getCourierOrders = () => api("/courier/orders");
export const getCourierToday = () => api("/courier/today");
export const reportOutcome = (id, status, reason) => api(`/courier/orders/${id}/outcome`, { method: "POST", body: { status, ...(reason && { reason }) } });

// Merchant portal
export const getPortalOrders = (params) => request("/portal/orders", { params });
export const createPortalOrder = (order) => api("/portal/orders", { method: "POST", body: order });
export const getPortalStatement = (params) => api("/portal/statement", { params });
export const getPortalApiKey = () => api("/portal/api-key");
export const rotatePortalApiKey = () => api("/portal/api-key", { method: "POST" });

// Admin: create logins for couriers / merchants (one-time passwords)
export const createCourierAccount = (courierId, email, password) => api(`/couriers/${courierId}/account`, { method: "POST", body: { email, password } });
export const createMerchantUser = (merchantId, email, password) => api(`/merchants/${merchantId}/users`, { method: "POST", body: { email, password } });
export const getPortalOrder = (id) => api(`/portal/orders/${id}`);
