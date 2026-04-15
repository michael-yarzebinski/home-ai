import { Controller, Post, Body } from '@nestjs/common';
import { MessageSource } from '../interfaces/message-request';
import { AIOrchestratorService } from '../ai-orchestrator.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly aiToolsService: AIOrchestratorService) {}

  @Post()
  async chat(@Body() body: { message: string; user_id: string }) {
    const { message, user_id } = body;

    if (!message) {
      return {
        success: false,
        reply: "Please provide a message.",
      };
    }

    try {
      const result = await this.aiToolsService.processMessage({
        messageText: message,
        source: MessageSource.CHAT,
        userIdentifier: user_id,
      });

      return {
        success: true,
        reply: result.reply,
        status: result.status,
      };
    } catch (error: any) {
      console.error('Chat endpoint error:', error);
      return {
        success: false,
        reply: "Sorry, something went wrong while processing your message.",
        error: error.message,
      };
    }
  }
}