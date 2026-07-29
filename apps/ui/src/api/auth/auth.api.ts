import { apiClient } from '@/api/client';

const BASE = '/v1/auth';

/** Mirrors server `LoginResult`. */
export type AuthLoginResult = {
  accessToken: string;
  userId: string;
  name: string;
  role: string;
};

export const authApi = {
  login: (body: { name: string; code: string }) =>
    apiClient.post<AuthLoginResult>(`${BASE}/login`, body),
} as const;
