import { authApi } from "@/api/auth/auth.api";
import { ROUTES } from "@/shared/constants/routes";
import { STORAGE_KEYS } from "@/shared/constants/storage";
import type { AuthResponse } from "@/types";
import type { Dispatch, SetStateAction } from "react";

export function createAuthSessionHandlers(
  setUser: Dispatch<SetStateAction<AuthResponse | null>>,
) {
  return {
    async login(email: string, password: string) {
      const data = await authApi.login(email, password);

      setUser(data);

      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data));
    },

    async register(username: string, email: string, password: string) {
      const data = await authApi.register(username, email, password);

      setUser(data);

      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data));
    },

    logout() {
      setUser(null);

      localStorage.removeItem(STORAGE_KEYS.user);

      window.location.href = ROUTES.login;
    },
  };
}
