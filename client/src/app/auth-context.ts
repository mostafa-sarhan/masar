import { createContext, useContext } from "react";
import type { Role } from "@masar/shared";
import type { SessionUser, SessionTenant } from "@/lib/types";
import type { ApiError } from "@/lib/api-client";

export interface AuthState {
  user: SessionUser | null;
  tenant: SessionTenant | null;
  checking: boolean;
  // Why the session ended (shown on the login page).
  sessionError: ApiError | null;
  login(email: string, password: string): Promise<SessionUser>;
  // Demo mode: one-click login as the demo company's account for a role.
  demoLogin(role: Role): Promise<SessionUser>;
  logout(): Promise<void>;
  passwordChanged(user: SessionUser): void;
  tenantChanged(changes: Partial<SessionTenant>): void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
