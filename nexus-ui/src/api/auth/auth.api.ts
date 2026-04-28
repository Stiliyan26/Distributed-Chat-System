import type { AuthResponse } from "../models/http-types";

import api from "../client/axios";
import { AuthApiPaths } from "./routes";

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
