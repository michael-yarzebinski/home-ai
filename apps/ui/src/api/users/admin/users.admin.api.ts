import type {
  InsertableUserApi,
  User,
  UpdatableUserApi,
} from '@home-ai/shared/domain/user/user';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const ADMIN_BASE = '/v1/admin/users';

/** Matches server `AdminCreateUserSchema` (plaintext numeric access code). */
export type AdminCreateUserBody = InsertableUserApi & { accessCode: string };

export const usersAdminApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<User>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<User>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  create: (body: AdminCreateUserBody) =>
    apiClient.post<User>(ADMIN_BASE, body),

  update: (id: string, body: UpdatableUserApi) =>
    apiClient.put<User>(`${ADMIN_BASE}/${encodeURIComponent(id)}`, body),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  restore: (id: string) =>
    apiClient.post<User>(`${ADMIN_BASE}/${encodeURIComponent(id)}/restore`),
} as const;
