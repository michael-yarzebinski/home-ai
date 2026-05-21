import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/auth/auth.api';

export function useLogin() {
  return useMutation({
    mutationFn: (body: { name: string; code: string }) => authApi.login(body),
  });
}
