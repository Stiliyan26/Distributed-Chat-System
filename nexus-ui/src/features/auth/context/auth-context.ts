import { createContext } from "react";

import type { AuthResponse } from "@/types";

export interface AuthContextType {
  user: AuthResponse | null;
  sessionReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
