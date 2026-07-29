import { Controller, Post, Body } from "@nestjs/common";
import { UserStore } from "../../core/stores/user/user.store";
import { v4 } from "uuid";
import { OrchestratorService } from "../orchestrator/orchestrator.service";
import { LLMModelTypes } from "../llm/llm.provider.sevice";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import {
  ChatRequestSchema,
  type ChatRequest,
} from "@home-ai/shared/domain/conversation/conversation";
import type { AuthUser } from "../../core/auth/jwt.strategy";

@Controller("v1/chat")
export class ChatController {
  constructor(
    private readonly orchestrator: OrchestratorService,
    private readonly userStore: UserStore,
  ) {}

  @Post()
  async chat(
    @Body(new ZodValidationPipe(ChatRequestSchema)) dto: ChatRequest,
    @CurrentUser() authUser: AuthUser,
  ) {
    const user = await this.userStore.getById(authUser.id);

    if (!user) {
      return { success: true };
    }

    const sessionId = dto.chatSessionId ?? v4();

    const result = await this.orchestrator.handleEvent(
      user,
      dto.message.trim(),
      sessionId,
      LLMModelTypes.IMMEDIATE,
    );

    return {
      success: true,
      userId: authUser.id,
      chatSessionId: sessionId,
      // Result from orchestrator is already formatted as { response: string } or { requiresApproval: true }
      ...result,
      timestamp: new Date().toISOString(),
    };
  }
}
