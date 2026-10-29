import { useCallback, useEffect, useState, type ReactNode } from "react";
import { login as apiLogin, logout as apiLogout, me, refresh, type Session } from "@/features/auth/api/auth-api";
import { ApiError, setSessionLostHandler } from "@/lib/api-client";
import { setDisplayPrefs } from "@/lib/locale";
import type { SessionUser, SessionTenant } from "@/lib/types";
import { AuthContext } from "./auth-context";

// The session lives in httpOnly cookies; here we only keep who is logged in.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [tenant, setTenantState] = useState<SessionTenant | null>(null);
  const [checking, setChecking] = useState(true);
  const [sessionError, setSessionError] = useState<ApiError | null>(null);

  const setTenant = useCallback((t: SessionTenant | null) => {
    setDisplayPrefs(t ?? {});
    setTenantState(t);
  }, []);

  useEffect(() => {
    setSessionLostHandler((err) => {
      setUser(null);
      if (err) setSessionError(err);
    });
    // The access token may have expired while the tab was closed: fall back to the refresh token.
    me()
      .catch(() => refresh())
      .then((data: Session) => {
        setUser(data.user);
        setTenant(data.tenant);
      })
      .catch((err: unknown) => {
        setUser(null);
        if (err instanceof ApiError && (err.code === "TENANT_SUSPENDED" || err.code === "TRIAL_EXPIRED")) setSessionError(err);
      })
      .finally(() => setChecking(false));
  }, [setTenant]);

  const login = useCallback(
    async (email: string, password: string) => {
      setSessionError(null);
      const data = await apiLogin(email, password);
      setUser(data.user);
      setTenant(data.tenant);
      return data.user;
    },
    [setTenant]
  );

  // After a successful password change the server issues fresh cookies.
  const passwordChanged = useCallback((nextUser: SessionUser) => setUser(nextUser), []);
  // After saving settings (currency, timezone shown across the app).
  const tenantChanged = useCallback((changes: Partial<SessionTenant>) => setTenant(tenant ? { ...tenant, ...changes } : null), [tenant, setTenant]);

  const logout = useCallback(async () => {
    await apiLogout().catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, tenant, checking, sessionError, login, logout, passwordChanged, tenantChanged }}>{children}</AuthContext.Provider>
  );
}
