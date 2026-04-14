import api from './axios';
import type { AuthResponse } from '@/types';

export const login = (email: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data);

// repeatPassword is required by the backend (must match password)
export const register = (username: string, email: string, password: string) =>
  api
    .post<AuthResponse>('/auth/register', { username, email, password, repeatPassword: password })
    .then((r) => r.data);

export const refresh = () => api.post('/auth/refresh').then((r) => r.data);
