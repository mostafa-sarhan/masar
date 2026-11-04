import type { OrderStatus, CreateOrderInput, OrderUpdate } from "@masar/shared";
import { api, request, downloadFile, type Params } from "@/lib/api-client";
import type { Order, OrderPageMeta, AuditEventRow, TrackingResult, ImportCheck } from "@/lib/types";

// Filters: search, status, merchant, courier, date, from, to, archived ("true" | "false" | "all")
export type OrderFilters = Params;

export const getOrders = (params: OrderFilters) => request<Order[], OrderPageMeta>("/orders", { params });
// Owner/admin only.
export const exportOrders = (params: OrderFilters) => request<Order[], { total: number; truncated: boolean }>("/orders/export", { params });
export const getOrderStats = () => api<Partial<Record<OrderStatus, number>>>("/orders/stats");
export const getOrderByBarcode = (barcode: string) => api<Order>(`/orders/barcode/${encodeURIComponent(barcode)}`);
export const getOrder = (id: string) => api<Order>(`/orders/${id}`);
export const getOrderHistory = (id: string) => api<AuditEventRow[]>(`/orders/${id}/history`);
export const createOrder = (order: CreateOrderInput) => api<Order>("/orders", { method: "POST", body: order });
export const updateOrder = (id: string, changes: OrderUpdate) => api<Order>(`/orders/${id}`, { method: "PATCH", body: changes });

// All-or-nothing on the server.
export const bulkAssign = (orderIds: string[], courier: string) =>
  api<{ requested: number; updated: number }>("/orders/bulk/assign", { method: "POST", body: { orderIds, courier } });
export const bulkStatus = (updates: { id: string; status: OrderStatus }[]) =>
  api<{ requested: number; updated: number }>("/orders/bulk/status", { method: "POST", body: { updates } });

// Excel import. mode: "dry-run" (validate only) | "commit" (all-or-nothing)
export function importOrders(file: File, mode: "dry-run" | "commit") {
  const form = new FormData();
  form.append("file", file);
  return api<ImportCheck & { created?: number }>("/orders/import", { method: "POST", body: form, params: { mode } });
}
export const downloadImportTemplate = () => downloadFile("/orders/import/template", "orders-template.xlsx");

// Public tracking (no login)
export const trackShipment = (trackingId: string) => api<TrackingResult>(`/track/${encodeURIComponent(trackingId)}`);
export const trackingUrl = (trackingId: string) => `${window.location.origin}/track/${trackingId}`;
