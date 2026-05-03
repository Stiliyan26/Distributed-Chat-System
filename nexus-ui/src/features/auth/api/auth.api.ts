import { AuthApiPaths } from "@/shared/api/auth-paths";
import api from "@/shared/api/axios";
import type { AuthResponse } from "@/shared/types";

export const authApi = {
  login: (email: string, password: string): Promise<AuthResponse> =>
    api.post<AuthResponse>(AuthApiPaths.LOGIN, { email, password }).then((r) => r.data),

  register: (username: string, email: string, password: string): Promise<AuthResponse> =>
    api
      .post<AuthResponse>(AuthApiPaths.REGISTER, {
        username,
        email,
        password,
        repeatPassword: password,
      })
      .then((r) => r.data),

  refresh: (): Promise<AuthResponse> =>
    api.post<AuthResponse>(AuthApiPaths.REFRESH).then((r) => r.data),
};
