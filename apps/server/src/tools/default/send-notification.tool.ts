// src/tools/default/send-notification.tool.ts
import { z } from "zod";
import { ToolHandler } from "../abstract/tool-handler";
import type { ToolContext } from "../types/tool-context";
import { Injectable } from "@nestjs/common";
import { Tool } from "../decorators/tool.decorator";
import { NotificationService } from "../../core/services/notification.service";

const SendNotificationToolSchema = z.object({
  userId: z.string().min(1).describe("User Id of the User to notify"),

  message: z.string().min(1).describe("The message content to send"),

  importance: z
    .enum(["low", "normal", "high"])
    .default("normal")
    .describe("Optional importance level"),

  skipQuietHours: z
    .boolean()
    .default(false)
    .describe("If true, send immediately even if the user is in quiet hours"),
});

export interface SendNotificationResult {
  success: boolean;
  message: string;
  queued?: boolean;
}

@Tool()
@Injectable()
export class SendNotificationTool extends ToolHandler<
  typeof SendNotificationToolSchema,
  SendNotificationResult
> {
  readonly name = "send-notification";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "Send a notification to a user via iMessage (BlueBubbles). " +
    "Automatically respects the user's quiet hours unless skipQuietHours is set to true.";

  readonly parameters = SendNotificationToolSchema;

  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async execute(
    params: z.infer<typeof SendNotificationToolSchema>,
    context: ToolContext,
  ): Promise<SendNotificationResult> {
    await this.notificationService.notifyUser(
      params.message,
      params.userId,
      context.userId,
      params.importance,
    );

    return {
      success: true,
      message: "Notification successfully sent to the user",
    };
  }
}
