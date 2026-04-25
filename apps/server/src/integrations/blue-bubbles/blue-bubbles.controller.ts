// src/integrations/bluebubbles/bluebubbles.controller.ts
import { Controller, Post, Body } from "@nestjs/common";
import { BlueBubblesService } from "./blue-bubbles.service";
import { LogStore } from "../../core/stores/log/log.store";
import {
  BlueBubblesMessageData,
  BlueBubblesWebhookPayload,
} from "./types/blue-bubble-webhook-payload";
import { UserStore } from "src/core/stores/user/user.store";
import { McpService } from "src/ai/mcp/mcp.service";
import { OrchestratorService } from "../../ai/orchestrator/orchestrator.service";

@Controller("bluebubbles")
export class BlueBubblesController {
  constructor(
    private readonly userStore: UserStore,
    private readonly blueBubblesService: BlueBubblesService,
    private readonly mcpService: McpService,
    private readonly orchestratorService: OrchestratorService,
    private readonly logStore: LogStore,
  ) {}

  @Post("webhook")
  async handleIncomingMessage(@Body() payload: BlueBubblesWebhookPayload) {
    this.logStore.create({
      severity: "info",
      message: "New message received from BlueBubbles",
      metadata: {
        payload,
      },
    });

    if (payload.type !== "new-message") {
      await this.logStore.create({
        severity: "info",
        message: `Message from BlueBubbles is of type ${payload.type}.  Skipping...`,
        metadata: {
          payload,
        },
      });

      return { success: true };
    }

    const blueBubblesData = payload.data as BlueBubblesMessageData;

    if (blueBubblesData.isFromMe) {
      await this.logStore.create({
        severity: "info",
        message: `Message from BlueBubbles is for me.  Skipping...`,
        metadata: {
          payload,
        },
      });

      return { success: true };
    }

    // Extract key information from BlueBubbles payload
    const chatId = blueBubblesData.chat.guid;
    const messageText = blueBubblesData.text;
    const phoneNumber = blueBubblesData.handle.address;

    if (!chatId || !messageText) {
      await this.logStore.create({
        severity: "warn",
        message: `BlueBubbles message does not have the correct information to be processed`,
        metadata: {
          chatId,
          messageText,
          sender: phoneNumber,
        },
      });

      return { success: false };
    }

    const user = await this.userStore.getByPhoneNumber(phoneNumber);
    if (!user) {
      await this.logStore.create({
        severity: "error",
        message: `Message received for user that is not recognized: ${phoneNumber}`,
        metadata: {
          phoneNumber,
        },
      });

      return { success: true };
    }

    // 1. Immediately show typing indicator
    await this.blueBubblesService.startTyping(chatId);
    // 2. Process the message with the LLM Runner
    const result = await this.orchestratorService.handleEvent(
      user,
      messageText,
      chatId,
    );

    // 3. Stop typing and send the reply
    await this.blueBubblesService.stopTyping(chatId);
    await this.blueBubblesService.sendMessage(chatId, result.content);

    await this.logStore.create({
      userId: undefined,
      severity: "info",
      message: `Successfully processed BlueBubbles message`,
      metadata: {
        chatId,
        content: result.content,
      },
    });

    return { success: true };
  }
}
