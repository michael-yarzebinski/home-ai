// src/chat/chat.controller.ts
import { Controller, Post, Body, BadRequestException } from "@nestjs/common";
import { UserStore } from "../../core/stores/user/user.store";
// src/chat/dto/chat-request.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsUUID } from "class-validator";
import { v4 } from "uuid";
import { OrchestratorService } from "../orchestrator/orchestrator.service";
import { LLMModelTypes } from "../llm/llm.provider.sevice";

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  chatSessionId?: string;
}

@Controller("chat")
export class ChatController {
  constructor(
    private readonly orchestrator: OrchestratorService,
    private readonly userStore: UserStore,
  ) { }

  @Post()
  async chat(@Body() dto: ChatRequestDto) {
    const user = await this.userStore.getById(dto.userId);

    if (!user) {
      // Use NotFoundException for a clearer 404 response
      return { success: true };
    }

    // Ensure we have a session ID to track the conversation
    const sessionId = dto.chatSessionId ?? v4();

    const result = await this.orchestrator.handleEvent(
      user,
      dto.message.trim(),
      sessionId,
      LLMModelTypes.IMMEDIATE,
    );

    return {
      success: true,
      userId: user.id,
      chatSessionId: sessionId,
      // Result from orchestrator is already formatted as { response: string } or { requiresApproval: true }
      ...result,
      timestamp: new Date().toISOString(),
    };
  }
}
