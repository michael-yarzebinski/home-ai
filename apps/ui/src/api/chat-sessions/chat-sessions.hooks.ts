import { useQuery } from '@tanstack/react-query';
import { chatSessionsApi } from '@/api/chat-sessions/chat-sessions.api';
import { chatSessionKeys } from '@/api/chat-sessions/chat-sessions.keys';

export function useChatSessionList() {
  return useQuery({
    queryKey: chatSessionKeys.list(),
    queryFn: () => chatSessionsApi.getSessions(),
  });
}

export function useChatSessionById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: chatSessionKeys.detail(id ?? ''),
    queryFn: () => chatSessionsApi.getSession(id!),
    enabled: enabled && Boolean(id),
  });
}
