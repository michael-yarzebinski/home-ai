import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import type { UpdatableUserApi, User } from '@home-ai/shared/domain/user/user';
import { usersApi } from '@/api/users/users.api';
import { userKeys } from '@/api/users/users.keys';
import { adminUserKeys } from '@/api/users/admin/users.admin.keys';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';

export function useUserSearch<TData = Paginated<User>>(
  criteria: SearchCriteriaBase,
  options?: Omit<UseQueryOptions<Paginated<User>, Error, TData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    ...options,
    queryKey: adminUserKeys.list(criteria),
    queryFn: () => usersApi.search(criteria),
  });
}

export function useUserById(id: string | undefined, enabled = true, options?: UseQueryOptions<User, Error, User, readonly unknown[]>) {
  return useQuery({
    ...options,
    queryKey: userKeys.detail(id ?? ''),
    queryFn: () => usersApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatableUserApi }) =>
      usersApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: userKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminUserKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminUserKeys.detail(id) });
    },
  });
}

export function useSoftDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.softDelete(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: userKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminUserKeys.lists() });
      void qc.invalidateQueries({ queryKey: adminUserKeys.detail(id) });
    },
  });
}
