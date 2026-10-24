import { api, request } from "./api";

// Filters: search, status, merchant, courier, date, from, to, archived ("true" | "false" | "all")

// { data: orders, meta: { total, page, pages, totalCost } }
export const getOrders = (params) => request("/orders", { params });

// Admin only. { data, meta: { total, truncated } }
export const exportOrders = (params) => request("/orders/export", { params });

export const getOrderStats = () => api("/orders/stats");
export const getOrderByBarcode = (barcode) => api(`/orders/barcode/${encodeURIComponent(barcode)}`);
export const createOrder = (order) => api("/orders", { method: "POST", body: order });
export const updateOrder = (id, changes) => api(`/orders/${id}`, { method: "PATCH", body: changes });

// { requested, updated, conflicts }
export const bulkAssign = (orderIds, courier) => api("/orders/bulk/assign", { method: "POST", body: { orderIds, courier } });
export const bulkStatus = (updates) => api("/orders/bulk/status", { method: "POST", body: { updates } });
