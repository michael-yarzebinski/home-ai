import type { ChatRequest } from '@home-ai/shared/domain/conversation/conversation';
import { apiClient } from '@/api/client';

const BASE = '/v1/chat';

export type ChatResponse = {
  success: boolean;
  userId: string;
  chatSessionId: string;
  timestamp: string;
} & Record<string, unknown>;

export const chatApi = {
  send: (body: ChatRequest) =>
    apiClient.post<ChatResponse>(BASE, body),
} as const;
