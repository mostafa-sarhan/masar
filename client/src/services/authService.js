import { api } from "./api";

export const login = (email, password) => api("/auth/login", { method: "POST", body: { email, password } });
export const logout = () => api("/auth/logout", { method: "POST" });
export const me = () => api("/auth/me");
export const refresh = () => api("/auth/refresh", { method: "POST" });
