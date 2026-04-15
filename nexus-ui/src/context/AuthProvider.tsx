import {
  login as apiLogin,
  refresh as apiRefresh,
  register as apiRegister,
} from "@/api/auth";
import { ROUTES } from "@/shared/constants/routes";
import { STORAGE_KEYS } from "@/shared/constants/storage";
import type { AuthResponse } from "@/types";
import React, { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.user);

      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [sessionReady, setSessionReady] = useState(
    () => !localStorage.getItem(STORAGE_KEYS.user),
  );

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.user);

    if (!stored) {
      setSessionReady(true);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await apiRefresh();
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
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);

    setUser(data);

    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data));
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const data = await apiRegister(username, email, password);

      setUser(data);

      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data));
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);

    localStorage.removeItem(STORAGE_KEYS.user);

    window.location.href = ROUTES.login;
  }, []);

  const isAuthenticated = !!user && sessionReady;

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionReady,
        isAuthenticated,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
