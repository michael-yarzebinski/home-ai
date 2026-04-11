import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';

export interface ConversationState {
  id?: number;
  chat_guid: string;
  user_id: string;
  current_task_type?: string;
  pending_parameters: Record<string, any>;
  clarification_question?: string | null;
  last_ai_message?: string | null;
  related_task_request_id?: number | null;
  conversation_summary?: string | null;
  status: 'active' | 'completed' | 'abandoned' | 'expired';
  last_activity_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class ConversationStatesService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  /**
   * Find or create conversation state by chat_guid
   */
  async findOrCreateByChatGuid(chat_guid: string, user_id: string): Promise<ConversationState> {
    let state = await this.knex('conversation_states')
      .where({ chat_guid })
      .first<ConversationState>();

    if (!state) {
      const [newState] = await this.knex('conversation_states')
        .insert({
          chat_guid,
          user_id,
          pending_parameters: {},
          status: 'active',
        })
        .returning('*');

      state = newState;
    } else {
      await this.knex('conversation_states')
        .where({ chat_guid })
        .update({ last_activity_at: this.knex.fn.now() });
    }

    return state;
  }

  /**
   * Update state after AI decision
   */
  async updateFromAIOutput(chat_guid: string, updateData: Partial<ConversationState>): Promise<void> {
    await this.knex('conversation_states')
      .where({ chat_guid })
      .update({
        ...updateData,
        updated_at: this.knex.fn.now(),
        last_activity_at: this.knex.fn.now(),
      });
  }

  /**
   * Link to a task_request once clarification is complete
   */
  async linkToTaskRequest(chat_guid: string, request_id: number): Promise<void> {
    await this.knex('conversation_states')
      .where({ chat_guid })
      .update({
        related_task_request_id: request_id,
        status: 'completed',
        updated_at: this.knex.fn.now(),
      });
  }

  async getActiveConversation(chat_guid: string): Promise<ConversationState | null> {
    return this.knex('conversation_states')
      .where({ chat_guid, status: 'active' })
      .first<ConversationState>();
  }

  async markAsCompleted(chat_guid: string): Promise<void> {
    await this.knex('conversation_states')
      .where({ chat_guid })
      .update({ status: 'completed', updated_at: this.knex.fn.now() });
  }
  /**
   * Build a clean, strongly-typed chat history for the AI model
   * This enables proper multi-turn conversations and clarification
   */
  async buildChatHistory(
    state: ConversationState,
    newUserMessage: string,
    baseSystemPrompt: string = 'You are a precise, privacy-first home assistant for a family.'
  ): Promise<ChatMessage[]> {
    const history: ChatMessage[] = [
      { role: 'system', content: baseSystemPrompt },
    ];

    // Add conversation summary if available
    if (state.conversation_summary) {
      history.push({
        role: 'assistant',
        content: `Previous conversation summary: ${state.conversation_summary}`,
      });
    }

    // Add last AI message if we have one
    if (state.last_ai_message) {
      history.push({
        role: 'assistant',
        content: state.last_ai_message,
      });
    }

    // Add current user message
    history.push({
      role: 'user',
      content: newUserMessage,
    });

    return history;
  }
}