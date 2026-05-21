import { useMutation } from '@tanstack/react-query';
import type { ChatRequest } from '@home-ai/shared/domain/conversation/conversation';
import { chatApi } from '@/api/chat/chat.api';

export function useSendChatMessage() {
  return useMutation({
    mutationFn: (body: ChatRequest) => chatApi.send(body),
  });
}
