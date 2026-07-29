import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { UpdatableUserApi, User } from '@home-ai/shared/domain/user/user';
import {
  usersAdminApi,
  type AdminCreateUserBody,
} from '@/api/users/admin/users.admin.api';
import { adminUserKeys } from '@/api/users/admin/users.admin.keys';
import { userKeys } from '@/api/users/users.keys';
import type { Paginated } from '@home-ai/shared/search/pagination';

export function useAdminUserSearch<TData = Paginated<User>>(
  criteria: SearchCriteriaBase,
  options?: Omit<UseQueryOptions<Paginated<User>, Error, TData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: adminUserKeys.list(criteria),
    queryFn: () => usersAdminApi.search(criteria),
    ...options,
  });
}

export function useAdminUserById(id: string | undefined, enabled = true, options?: UseQueryOptions<User, Error, User, readonly unknown[]>) {
  return useQuery({
    ...options,
    queryKey: adminUserKeys.detail(id ?? ''),
    queryFn: () => usersAdminApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminUserCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminCreateUserBody) => usersAdminApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminUserKeys.lists() });
    },
  });
}

export function useAdminUserUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatableUserApi }) =>
      usersAdminApi.update(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: adminUserKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminUserKeys.lists() });
      void qc.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useAdminSoftDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersAdminApi.softDelete(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminUserKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminUserKeys.lists() });
      void qc.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

export function useAdminUserRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersAdminApi.restore(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: adminUserKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: adminUserKeys.lists() });
      void qc.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}
