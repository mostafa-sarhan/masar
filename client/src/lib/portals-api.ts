import type { Params } from "./api-client";
import { api, request } from "./api-client";
import type { CourierOrder, CourierToday, PortalOrder, PortalStatement, PageMeta, SessionUser } from "./types";

// Courier mobile view
export const getCourierOrders = () => api<CourierOrder[]>("/courier/orders");
export const getCourierToday = () => api<CourierToday>("/courier/today");
export const reportOutcome = (id: string, status: "delivered" | "returned" | "refused" | "exchanged", reason?: string) =>
  api<CourierOrder>(`/courier/orders/${id}/outcome`, { method: "POST", body: { status, ...(reason && { reason }) } });

// Merchant portal
export const getPortalOrders = (params: Params) => request<PortalOrder[], PageMeta>("/portal/orders", { params });
export const getPortalOrder = (id: string) => api<PortalOrder>(`/portal/orders/${id}`);
export const getPortalQuote = (governorate: string, city: string) => api<{ zoneName: string | null; shippingFee: number | null }>("/portal/quote", { params: { governorate, city } });
export const createPortalOrder = (order: { fullName: string; phone: string; governorate: string; city: string; address: string; cost: number; description?: string }) =>
  api<PortalOrder>("/portal/orders", { method: "POST", body: order });
export const getPortalStatement = (params: Params) => api<PortalStatement>("/portal/statement", { params });
export const getPortalApiKey = () => api<{ name: string; apiKeyPrefix: string | null; hasActiveKey: boolean; apiKeyCreatedAt: string | null }>("/portal/api-key");
export const rotatePortalApiKey = () => api<{ apiKey: string; apiKeyPrefix: string }>("/portal/api-key", { method: "POST" });

// Admin: logins for couriers / merchants (one-time passwords)
export const createCourierAccount = (courierId: string, email: string, password: string) =>
  api<SessionUser>(`/couriers/${courierId}/account`, { method: "POST", body: { email, password } });
export const createMerchantUser = (merchantId: string, email: string, password: string) =>
  api<SessionUser>(`/merchants/${merchantId}/users`, { method: "POST", body: { email, password } });
