import { api } from "./api";

// Couriers
export const getDeliveries = () => api("/deliveries");
export const createDelivery = (name) => api("/deliveries", { method: "POST", body: { name } });

// Merchants
export const getMerchants = () => api("/merchants");
export const createMerchant = (name) => api("/merchants", { method: "POST", body: { name } });

// Users (admin)
export const getUsers = () => api("/users");
export const getAuditLogs = () => api("/users/auditlogs");
export const createUser = (user) => api("/users", { method: "POST", body: user });
export const changePassword = (email, newPassword) =>
  api("/users/password", { method: "PUT", body: { email, newPassword } });
export const changeRole = (targetEmail, newRole) =>
  api("/users/role", { method: "PUT", body: { targetEmail, newRole } });
