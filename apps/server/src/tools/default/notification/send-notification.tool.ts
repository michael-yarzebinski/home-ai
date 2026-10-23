// src/tools/default/send-notification.tool.ts
import { z } from "zod";
import { ToolHandler } from "../../abstract/tool-handler";
import type { ToolContext } from "../../types/tool-context";
import { Injectable } from "@nestjs/common";
import { Tool } from "../../decorators/tool.decorator";
import { NotificationService } from "../../../integrations/notification/notification.service";
import { ToolParameterUtils } from "../../utils/tool-parameter-utils";

/** Trims and removes only a matching pair of surrounding quotes (preserves apostrophes inside the body). */
function preprocessNotificationMessage(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  let s = typeof value === "string" ? value.trim() : String(value).trim();
  if (s.length >= 2) {
    const a = s[0];
    const b = s[s.length - 1];
    if ((a === '"' && b === '"') || (a === "'" && b === "'")) {
      s = s.slice(1, -1).trim();
    }
  }
  return s;
}

const SendNotificationToolSchema = z.object({
  userId: z
    .preprocess(ToolParameterUtils.stripQuotes, z.string().min(1))
    .describe("User Id of the User to notify"),

  message: z
    .preprocess(preprocessNotificationMessage, z.string().min(1))
    .describe("The message content to send"),

  filename: z
    .preprocess((value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }, z.string().optional())
    .describe(
      "Optional snapshot file name to send with the message, such as front_door_20261012_163000.jpg. Use the same name passed to save-image.",
    ),
});

export interface SendNotificationResult {
  success: boolean;
  message: string;
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
    "Pass filename to include a saved snapshot with the message. " +
    "Respects the user's quiet hours. " +
    "When the message depends on an image, send it on a later step, after you have received that image and saved it.";

  readonly parameters = SendNotificationToolSchema;

  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async execute(
    params: z.infer<typeof SendNotificationToolSchema>,
    _context: ToolContext,
  ): Promise<SendNotificationResult> {
    await this.notificationService.notifyUser(params.message, params.userId, {
      fileName: params.filename,
    });

    return {
      success: true,
      message: "Notification sent",
    };
  }
}
