import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ConversationStore } from "../../stores/conversation/conversation.store";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import type { AuthUser } from "../../auth/jwt.strategy";

@Controller("v1/chat/sessions")
export class ChatSessionsController {
  constructor(private readonly conversationStore: ConversationStore) {}

  @Get()
  getSessions(@CurrentUser() authUser: AuthUser) {
    // Always owner-scoped — even admins only see their own personal threads here.
    return this.conversationStore.searchByUserId(
      { page: 1, pageSize: 50 },
      authUser.id,
    );
  }

  @Get(":id")
  async getSession(@Param("id") id: string, @CurrentUser() authUser: AuthUser) {
    const session = await this.conversationStore.getByIdForUser(
      id,
      authUser.id,
    );
    if (!session) throw new NotFoundException(`Chat session ${id} not found`);
    return session;
  }
}
