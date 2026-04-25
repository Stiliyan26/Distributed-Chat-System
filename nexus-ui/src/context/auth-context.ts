import type { AuthResponse } from '@/types';
import { createContext } from 'react';

export interface AuthContextType {
  user: AuthResponse | null;
  sessionReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
