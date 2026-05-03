import React, { useEffect, useMemo, useState } from "react";

import { authApi } from "@/api/auth/auth.api";
import { STORAGE_KEYS } from "@/shared/constants/storage";
import type { AuthResponse } from "@/types";

import { AuthContext } from "./auth-context";
import { createAuthSessionHandlers } from "./auth-handlers";
import { parseStoredAuthUser } from "./parse-stored-auth-user";

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

    void restoreSession();

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
