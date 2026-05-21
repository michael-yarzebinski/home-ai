import type { Note } from '@home-ai/shared/domain/note/note';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';
import { notesApi } from '@/api/notes/notes.api';

const ADMIN_BASE = '/v1/admin/notes';

export const notesAdminApi = {
  ...notesApi,
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Note>>(`${ADMIN_BASE}/search`, dto),

  getById: (id: string) =>
    apiClient.get<Note>(`${ADMIN_BASE}/${encodeURIComponent(id)}`),

  restore: (id: string) =>
    apiClient.post<Note>(`${ADMIN_BASE}/${encodeURIComponent(id)}/restore`),
} as const;
