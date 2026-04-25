import React, { useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import { createAuthSessionHandlers } from "./utils/auth-handlers";
import { parseStoredAuthUser } from "./utils/parse-stored-auth-user";

import { authApi } from "@/api/auth";
import { STORAGE_KEYS } from "@/shared/constants/storage";
import type { AuthResponse } from "@/types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(() =>
    parseStoredAuthUser(),
  );

  const [sessionReady, setSessionReady] = useState(() => {
    return !localStorage.getItem(STORAGE_KEYS.user);
  });

  const { login, register, logout } = useMemo(
    () => createAuthSessionHandlers(setUser),
    [setUser],
  );

  const isAuthenticated = !!user && sessionReady;

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const stored = localStorage.getItem(STORAGE_KEYS.user);

      if (!stored) {
        setSessionReady(true);
        return;
      }

      try {
        await authApi.refresh();
      } catch {
        if (!cancelled) {
          setUser(null);
          localStorage.removeItem(STORAGE_KEYS.user);
        }
      } finally {
        if (!cancelled) {
          setSessionReady(true);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const authContextValue = useMemo(() => {
    return {
      user,
      sessionReady,
      isAuthenticated,
      login,
      register,
      logout,
    };
  }, [user, sessionReady, isAuthenticated, login, register, logout]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}
