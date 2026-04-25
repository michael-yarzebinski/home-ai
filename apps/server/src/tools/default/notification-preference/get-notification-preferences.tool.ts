import { z } from "zod";
import { Injectable } from "@nestjs/common";
import { ToolHandler } from "../../abstract/tool-handler";
import { ToolContext } from "../../types/tool-context";
import { Tool } from "../../decorators/tool.decorator";
import { NotificationPreferenceStore } from "../../../core/stores/notification-preference/notification-preference.store";

const GetNotificationPreferencesSchema = z.object({
  targetUserId: z
    .string()
    .optional()
    .describe("Optional: Filter by a specific user ID."),
  triggerType: z
    .string()
    .optional()
    .describe(
      "Optional: Filter by the type of trigger (e.g., 'device_state', 'maintenance', 'security').",
    ),
});

export interface NotificationPreferenceResult {
  preferences: {
    id: string;
    userId: string;
    triggerType: string;
    triggerConfig: any;
    messageTemplate: string;
    importance: string;
    active: boolean;
  }[];
}

@Tool()
@Injectable()
export class GetNotificationPreferencesTool extends ToolHandler<
  typeof GetNotificationPreferencesSchema,
  NotificationPreferenceResult
> {
  readonly name = "get-notification-preferences";

  readonly description =
    "Lists global notification preferences across users. " +
    "Essential for the 'Automation' user to determine which family members want to be notified " +
    "when a specific device state changes or a maintenance event occurs.";

  readonly parameters = GetNotificationPreferencesSchema;

  constructor(
    private readonly notificationPreferenceStore: NotificationPreferenceStore,
  ) {
    super();
  }

  async execute(
    params: z.infer<typeof GetNotificationPreferencesSchema>,
    context: ToolContext,
  ): Promise<NotificationPreferenceResult> {
    // Fetch records from the database matching the criteria
    const preferences = await this.notificationPreferenceStore.getForTool(
      params.targetUserId,
      params.triggerType,
    );

    return {
      preferences: preferences.map((p) => ({
        id: p.id,
        userId: p.userId,
        triggerType: p.triggerType,
        triggerConfig: p.triggerConfig,
        messageTemplate: p.messageTemplate,
        importance: p.importance,
        active: p.active,
      })),
    };
  }
}
