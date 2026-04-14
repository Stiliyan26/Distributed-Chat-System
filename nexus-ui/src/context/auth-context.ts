import { createContext } from 'react';
import type { AuthResponse } from '@/types';

export interface AuthContextType {
  user: AuthResponse | null;
  /** True only after bootstrap: anonymous users are ready immediately; restored sessions wait for cookie refresh. */
  sessionReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: AuthResponse | null) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
