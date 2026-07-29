import type { Note, UpdatableNote } from '@home-ai/shared/domain/note/note';
import type { SearchCriteriaBase } from '@home-ai/shared/search/search';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const BASE = '/v1/notes';

export const notesApi = {
  search: (dto: SearchCriteriaBase) =>
    apiClient.post<Paginated<Note>>(`${BASE}/search`, dto),

  getById: (id: string) => apiClient.get<Note>(`${BASE}/${encodeURIComponent(id)}`),

  update: (id: string, body: UpdatableNote) =>
    apiClient.put<Note>(`${BASE}/${encodeURIComponent(id)}`, body),

  softDelete: (id: string) =>
    apiClient.delete<void>(`${BASE}/${encodeURIComponent(id)}`),
} as const;
