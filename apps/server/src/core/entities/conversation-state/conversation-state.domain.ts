export interface ConversationState {
    id: string;
    chatGuid: string;
    userId: string;
    currentTaskName?: string | null;
    pendingParameters: Record<string, any>;
    clarificationQuestion?: string | null;
    lastAIMessage?: string | null;
    relatedTaskRequestId?: string | null;
    conversationSummary?: string | null;
    status: string;
    lastActivityAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }