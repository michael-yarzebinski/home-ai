import { Controller, Post, Body } from '@nestjs/common';
import { AIToolsService } from '../../tools/ai-tools.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly aiToolsService: AIToolsService) {}

  @Post()
  async chat(@Body() body: { message: string; user_id?: string }) {
    const { message, user_id } = body;

    if (!message) {
      return {
        success: false,
        reply: "Please provide a message.",
      };
    }

    try {
      const result = await this.aiToolsService.processMessage(
        message,
        user_id || null,
      );

      return {
        success: true,
        reply: result.reply,
        status: result.status,
        data: result.data || null,
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