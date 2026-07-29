// src/integrations/bluebubbles/bluebubbles.controller.ts
import { Controller, Post, Body } from "@nestjs/common";
import { Public } from "src/common/decorators/public.decorator";
import { BlueBubblesService } from "./blue-bubbles.service";
import { LogStore } from "../../core/stores/monitoring/log/log.store";
import {
  BlueBubblesMessageData,
  BlueBubblesWebhookPayload,
} from "./types/blue-bubble-webhook-payload";
import { UserStore } from "src/core/stores/user/user.store";
import { OrchestratorService } from "../../ai/orchestrator/orchestrator.service";
import { LLMModelTypes } from "../../ai/llm/llm.provider.sevice";

@Controller("v1/bluebubbles")
export class BlueBubblesController {
  constructor(
    private readonly userStore: UserStore,
    private readonly blueBubblesService: BlueBubblesService,
    private readonly orchestratorService: OrchestratorService,
    private readonly logStore: LogStore,
  ) {}

  @Post("webhook")
  @Public()
  async handleIncomingMessage(@Body() payload: BlueBubblesWebhookPayload) {
    // this.logStore.create({
    //   severity: "info",
    //   message: "New message received from BlueBubbles",
    //   metadata: {
    //     payload,
    //   },
    // });

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
      return { success: true };
    }

    // Extract key information from BlueBubbles payload
    const chatId =
      blueBubblesData.chat?.guid ?? blueBubblesData.chats?.[0]?.guid;
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
    let result: any;
    try {
      // 2. Process the message with the LLM Runner
      result = await this.orchestratorService.handleEvent(
        user,
        messageText,
        chatId,
        LLMModelTypes.IMMEDIATE,
      );
    } catch (error) {
      await this.logStore.create({
        userId: user.id,
        severity: "error",
        message: `Error processing BlueBubbles message`,
        metadata: { error: (error as any).message },
      });
      await this.blueBubblesService.stopTyping(chatId);
      await this.blueBubblesService.sendMessage(
        chatId,
        "We've hit a road block...  Please try again later.",
      );
      return { success: false };
    }

    // 3. Stop typing and send the reply
    await this.blueBubblesService.stopTyping(chatId);
    await this.blueBubblesService.sendMessage(chatId, result.response);

    await this.logStore.create({
      userId: user.id,
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
