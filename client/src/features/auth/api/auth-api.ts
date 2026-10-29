import { api } from "@/lib/api-client";
import type { SessionUser, SessionTenant } from "@/lib/types";

export interface Session {
  user: SessionUser;
  tenant: SessionTenant;
}

export const login = (email: string, password: string) => api<Session>("/auth/login", { method: "POST", body: { email, password } });
export const logout = () => api<{ loggedOut: true }>("/auth/logout", { method: "POST" });
export const me = () => api<Session>("/auth/me");
export const refresh = () => api<Session>("/auth/refresh", { method: "POST" });
export const changeOwnPassword = (currentPassword: string, newPassword: string) =>
  api<{ user: SessionUser }>("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
