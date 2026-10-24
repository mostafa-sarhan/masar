import { api } from "./api";

// Filters accepted by the orders endpoints:
// search, status, company, delivery, date, from, to, archived ("true" | "false" | "all")

// Paginated: { items, total, page, pages, totalCost }
export const getOrders = (params) => api("/orders", { params });

// Every matching order (reports, printing, Excel)
export const exportOrders = (params) => api("/orders/export", { params });

// { [status]: count }
export const getOrderStats = () => api("/orders/stats");

export const getCompanies = (params) => api("/orders/companies", { params });

export const getOrderByBarcode = (barcode) => api(`/orders/barcode/${encodeURIComponent(barcode)}`);

export const getOrdersByDelivery = (name) => api(`/orders/delivery/${encodeURIComponent(name)}`);

export const createOrder = (order) => api("/orders", { method: "POST", body: order });

export const updateOrder = (id, changes) => api(`/orders/${id}`, { method: "PATCH", body: changes });
