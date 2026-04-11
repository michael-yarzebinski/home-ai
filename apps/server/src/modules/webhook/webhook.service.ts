import { Injectable } from '@nestjs/common';
import { AIToolsService } from '../../tools/ai-tools.service';
import { ConversationStatesService, ConversationState, ChatMessage } from '../conversation-states/conversation-states.service';
import { UsersService, UserRecord } from '../users/users.service';

@Injectable()
export class WebhookService {
  constructor(
    private readonly aiToolsService: AIToolsService,
    private readonly conversationStatesService: ConversationStatesService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Handle device events from Home Assistant (unchanged)
   */
  async handleDeviceEvent(payload: any) {
    const message = payload.message || 
      `${payload.device || 'Device'} - ${payload.event || 'unknown event'}`;

    return this.aiToolsService.processMessage(
      message,
      null,
      'webhook'
    );
  }

  /**
   * Handle incoming iMessage from BlueBubbles with full multi-turn history
   */
  async handleBlueBubblesMessage(payload: any) {
    const chat_guid = payload.chatGuid || payload.chat_guid;
    const handle = payload.handle || payload.from || payload.user_handle;
    const message_text = payload.message || payload.text || payload.body;

    if (!chat_guid || !message_text) {
      throw new Error('Missing chat_guid or message_text in BlueBubbles payload');
    }

    // 1. Resolve user from messaging handle
    const user: UserRecord | null = await this.usersService.findByMessagingHandle(handle);
    if (!user) {
      throw new Error(`No user found for messaging handle: ${handle}`);
    }

    // 2. Load or create conversation state
    const conversationState: ConversationState = await this.conversationStatesService.findOrCreateByChatGuid(
      chat_guid,
      user.user_id
    );

    // 3. Build full chat history
    const systemPrompt = `You are a precise, privacy-first home assistant for a family.`;
    const chatHistory: ChatMessage[] = await this.conversationStatesService.buildChatHistory(
      conversationState,
      message_text,
      systemPrompt
    );

    // 4. Process with AI using full history
    const aiResult = await this.aiToolsService.processMessageWithHistory(
      chatHistory,
      user.user_id,
      'imessage'
    );

    // 5. Update conversation state based on AI output
    await this.updateConversationStateFromAIResult(chat_guid, aiResult, conversationState);

    return {
      success: true,
      user_id: user.user_id,
      aiResult,
    };
  }

  private async updateConversationStateFromAIResult(
    chat_guid: string,
    aiResult: any,
    currentState: ConversationState
  ): Promise<void> {
    const updateData: Partial<ConversationState> = {
      last_ai_message: aiResult.reply || aiResult.response || JSON.stringify(aiResult),
      current_task_type: aiResult.task_type || currentState.current_task_type,
      pending_parameters: aiResult.pending_parameters || currentState.pending_parameters,
      conversation_summary: aiResult.conversation_summary || currentState.conversation_summary,
    };

    if (aiResult.clarification_question) {
      updateData.clarification_question = aiResult.clarification_question;
    }

    await this.conversationStatesService.updateFromAIOutput(chat_guid, updateData);
  }
}