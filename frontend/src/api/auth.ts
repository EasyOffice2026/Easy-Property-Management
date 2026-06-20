import { apiClient } from './client';
import { AuthUser } from '../store';

interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  };
}

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  return data.data;
}
