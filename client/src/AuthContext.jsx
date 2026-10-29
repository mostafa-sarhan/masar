import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { login as apiLogin, logout as apiLogout, me, refresh } from "./services/authService";
import { setSessionLostHandler } from "./services/api";
import { setDisplayPrefs } from "./utils/locale";

const AuthContext = createContext(null);

// The session lives in httpOnly cookies; here we only keep who is logged in.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenantState] = useState(null);
  const setTenant = useCallback((t) => {
    setDisplayPrefs(t || {});
    setTenantState(t);
  }, []);
  const [checking, setChecking] = useState(true);
  const [sessionError, setSessionError] = useState(null); // why the session ended, shown on the login page

  useEffect(() => {
    setSessionLostHandler((err) => {
      setUser(null);
      if (err) setSessionError(err);
    });
    // Access token may have expired while the tab was closed: fall back to the refresh token.
    me()
      .catch(() => refresh())
      .then((data) => {
        setUser(data.user);
        setTenant(data.tenant);
      })
      .catch((err) => {
        setUser(null);
        if (err?.code === "TENANT_SUSPENDED" || err?.code === "TRIAL_EXPIRED") setSessionError(err);
      })
      .finally(() => setChecking(false));
  }, [setTenant]);

  const login = useCallback(async (email, password) => {
    setSessionError(null);
    const data = await apiLogin(email, password);
    setUser(data.user);
    setTenant(data.tenant);
    return data.user;
  }, [setTenant]);

  // After a successful password change the server issues fresh cookies; update who we are.
  const passwordChanged = useCallback((nextUser) => setUser(nextUser), []);
  // After saving settings (currency, timezone shown across the app).
  const tenantChanged = useCallback((changes) => setTenant({ ...tenant, ...changes }), [tenant, setTenant]);

  const logout = useCallback(async () => {
    await apiLogout().catch(() => {});
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, tenant, checking, sessionError, login, logout, passwordChanged, tenantChanged }}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
