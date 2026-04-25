// src/tools/default/add-notification-preference.tool.ts
import { Injectable } from '@nestjs/common';
import { NotificationPreferenceStore } from 'src/core/stores/notification-preference/notification-preference.store';
import { ToolHandler } from 'src/tools/abstract/tool-handler';
import { Tool } from 'src/tools/decorators/tool.decorator';
import { ToolContext } from 'src/tools/types/tool-context';
import { z } from 'zod';

const AddNotificationPreferenceToolSchema = z.object({
  triggerType: z
    .string()
    .min(1)
    .describe('Type of trigger (e.g. "device_state", "calendar_event", "recipe_added")'),
  triggerConfig: z
    .record(z.string(), z.any())
    .optional()
    .describe('Configuration for the trigger (e.g. {"entity_id": "light.kitchen"})'),
  messageTemplate: z.string().min(1).describe('Template for the notification message'),
  importance: z
    .enum(['low', 'normal', 'high'])
    .default('normal')
    .describe('Optional importance level'),
});

export interface AddNotificationPreferenceResult {
  success: boolean;
  message: string;
}

@Tool()
@Injectable()
export class AddNotificationPreferenceTool extends ToolHandler<
  typeof AddNotificationPreferenceToolSchema,
  AddNotificationPreferenceResult
> {
  readonly name = 'add-notification-preference';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Add a new notification preference for the current user. ' +
    'Use this to configure when and how the user receives notifications.';

  readonly parameters = AddNotificationPreferenceToolSchema;

  constructor(private readonly notificationPreferenceStore: NotificationPreferenceStore) {
    super();
  }

  async execute(
    params: z.infer<typeof AddNotificationPreferenceToolSchema>,
    context: ToolContext,
  ): Promise<AddNotificationPreferenceResult> {
    await this.notificationPreferenceStore.create({
      userId: context.userId,
      triggerType: params.triggerType,
      triggerConfig: params.triggerConfig || {},
      messageTemplate: params.messageTemplate,
      importance: params.importance || 'normal',
    });

    return {
      success: true,
      message: `✅ Notification preference for trigger "${params.triggerType}" has been added.`,
    };
  }
}
