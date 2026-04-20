import { Body, Controller, Post, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { MessageSource } from '../interfaces/message-request';
import { AIOrchestratorService } from '../ai-orchestrator.service';
import { Public } from '../../auth/decorators/public.decorator';

@Public()
@Controller('chat')
export class ChatController {
  constructor(
    private readonly aiToolsService: AIOrchestratorService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  async chat(@Body() body: { message: string; user_id?: string }, @Req() req: Request) {
    const { message } = body;
    let user_id = body.user_id;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = await this.jwtService.verifyAsync<{ sub: string }>(
          authHeader.slice(7).trim(),
        );
        user_id = payload.sub;
      } catch {
        return {
          success: false,
          reply: 'Invalid or expired session token.',
        };
      }
    }

    if (!message) {
      return {
        success: false,
        reply: 'Please provide a message.',
      };
    }

    if (!user_id?.trim()) {
      return {
        success: false,
        reply: 'Provide Authorization: Bearer token or user_id in the request body.',
      };
    }

    try {
      const result = await this.aiToolsService.processMessage({
        messageText: message,
        source: MessageSource.CHAT,
        userIdentifier: user_id.trim(),
      });

      return {
        success: true,
        reply: result.response,
        status: result.status,
      };
    } catch (error: any) {
      console.error('Chat endpoint error:', error);
      return {
        success: false,
        reply: 'Sorry, something went wrong while processing your message.',
        error: error.message,
      };
    }
  }
}
