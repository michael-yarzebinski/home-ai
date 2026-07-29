import type { Conversation } from '@home-ai/shared/domain/conversation/conversation';
import type { Paginated } from '@home-ai/shared/search/pagination';
import { apiClient } from '@/api/client';

const BASE = '/v1/chat/sessions';

export const chatSessionsApi = {
  getSessions: () => apiClient.get<Paginated<Conversation>>(BASE),

  getSession: (id: string) =>
    apiClient.get<Conversation>(`${BASE}/${encodeURIComponent(id)}`),
} as const;
