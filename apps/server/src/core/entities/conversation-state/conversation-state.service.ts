// src/core/entities/conversation-states/conversation-state.service.ts
import { Injectable } from '@nestjs/common';
import { ConversationStateStore } from './conversation-state.store';
import { ConversationState } from './conversation-state.domain';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ConversationStateService {
  constructor(private readonly conversationStateStore: ConversationStateStore) {}

  /**
   * Reader facade - safe read-only methods
   * Following the exact pattern used in DevicesService, FactsService, etc.
   */
  reader(): Pick<
    ConversationStateStore,
    'getAll' | 'getById' | 'findByChatGuid' | 'findActiveByChatGuid'
  > {
    return this.conversationStateStore;
  }

  /**
   * Find existing conversation or create a new one for the chat
   */
  async findOrCreateByChatGuid(chatGuid: string, userId: string): Promise<ConversationState> {
    return this.conversationStateStore.findOrCreateByChatGuid(chatGuid, userId);
  }

  /**
   * Update state after AI decision / clarification
   */
  async updateFromAIOutput(chatGuid: string, updateData: Partial<ConversationState>): Promise<void> {
    await this.conversationStateStore.updateFromAIOutput(chatGuid, updateData);
  }

  /**
   * Link conversation to a completed task request
   */
  async linkToTaskRequest(chatGuid: string, taskRequestId: string): Promise<void> {
    await this.conversationStateStore.linkToTaskRequest(chatGuid, taskRequestId);
  }

  /**
   * Mark conversation as completed
   */
  async markAsCompleted(chatGuid: string): Promise<void> {
    await this.conversationStateStore.markAsCompleted(chatGuid);
  }

  /**
   * Build chat history for sending to the LLM
   */
  async buildChatHistory(
    state: ConversationState,
    newUserMessage: string,
    baseSystemPrompt: string = 'You are a precise, privacy-first home assistant for a family.',
  ): Promise<ChatMessage[]> {
    const history: ChatMessage[] = [
      { role: 'system', content: baseSystemPrompt },
    ];

    if (state.conversationSummary) {
      history.push({
        role: 'assistant',
        content: `Previous conversation summary: ${state.conversationSummary}`,
      });
    }

    if (state.lastAIMessage) {
      history.push({
        role: 'assistant',
        content: state.lastAIMessage,
      });
    }

    history.push({
      role: 'user',
      content: newUserMessage,
    });

    return history;
  }
}