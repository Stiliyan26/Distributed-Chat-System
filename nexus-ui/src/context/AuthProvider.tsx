import React, { useState, useCallback, useEffect } from 'react';
import type { AuthResponse } from '@/types';
import { login as apiLogin, register as apiRegister, refresh as apiRefresh } from '@/api/auth';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(() => {
    try {
      const stored = localStorage.getItem('nexus_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [sessionReady, setSessionReady] = useState(() => !localStorage.getItem('nexus_user'));

  useEffect(() => {
    const stored = localStorage.getItem('nexus_user');
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
          localStorage.removeItem('nexus_user');
        }
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    setUser(data);
    localStorage.setItem('nexus_user', JSON.stringify(data));
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const data = await apiRegister(username, email, password);
    setUser(data);
    localStorage.setItem('nexus_user', JSON.stringify(data));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('nexus_user');
    window.location.href = '/login';
  }, []);

  const isAuthenticated = !!user && sessionReady;

  return (
    <AuthContext.Provider
      value={{ user, sessionReady, isAuthenticated, login, register, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
