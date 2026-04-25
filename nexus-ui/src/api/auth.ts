import type { AuthResponse } from '@/types';
import api from './axios';

export const authApi = {
  login: (email: string, password: string): Promise<AuthResponse> =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  register: (username: string, email: string, password: string): Promise<AuthResponse> =>
    api
      .post<AuthResponse>('/auth/register', { username, email, password, repeatPassword: password })
      .then((r) => r.data),

  refresh: (): Promise<AuthResponse> =>
    api.post('/auth/refresh').then((r) => r.data),
};