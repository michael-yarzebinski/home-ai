import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ConversationStore } from "../../stores/conversation/conversation.store";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import type { AuthUser } from "../../auth/jwt.strategy";

@Controller("v1/chat/sessions")
export class ChatSessionsController {
  constructor(private readonly conversationStore: ConversationStore) {}

  @Get()
  getSessions(@CurrentUser() user: AuthUser) {
    // Empty query = list all sessions for this user, most recent first.
    return this.conversationStore.search({ page: 1, pageSize: 50 }, user);
  }

  @Get(":id")
  async getSession(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    const session = await this.conversationStore.getById(id, false, user);
    if (!session) throw new NotFoundException(`Chat session ${id} not found`);
    return session;
  }
}
