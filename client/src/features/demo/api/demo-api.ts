import type { Role } from "@masar/shared";
import { api } from "@/lib/api-client";
import type { Session } from "@/features/auth/api/auth-api";

export type DemoInfo =
  | { enabled: false }
  | { enabled: true; roles: Role[]; whatsapp: string | null; resetMinutes: number; nextResetAt: string | null };

export const getDemoInfo = () => api<DemoInfo>("/demo");
export const demoLogin = (role: Role) => api<Session>("/demo/login", { method: "POST", body: { role } });
