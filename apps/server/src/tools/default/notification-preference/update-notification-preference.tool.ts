import { z } from 'zod';
import { NotificationPreferenceStore } from 'src/core/stores/notification-preference/notification-preference.store';
import { ToolHandler } from 'src/tools/abstract/tool-handler';
import { ToolContext } from 'src/tools/types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const UpdateNotificationPreferenceToolSchema = z.object({
  preferenceId: z.string().min(1).describe('The ID of the notification preference to update'),
  triggerType: z.string().optional().describe('New trigger type'),
  triggerConfig: z
    .record(z.string(), z.any())
    .optional()
    .describe('New trigger configuration'),
  messageTemplate: z.string().optional().describe('New message template'),
  importance: z.enum(['low', 'normal', 'high']).optional().describe('New importance level'),
  active: z.boolean().optional().describe('Whether this preference is active'),
});

export interface UpdateNotificationPreferenceResult {
  success: boolean;
  message: string;
}

@Tool()
@Injectable()
export class UpdateNotificationPreferenceTool extends ToolHandler<
  typeof UpdateNotificationPreferenceToolSchema,
  UpdateNotificationPreferenceResult
> {
  readonly name = 'update-notification-preference';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Update an existing notification preference for the current user. ' +
    'Use this tool to modify trigger settings, message templates, or importance level.';

  readonly parameters = UpdateNotificationPreferenceToolSchema;

  constructor(private readonly notificationPreferenceStore: NotificationPreferenceStore) {
    super();
  }

  async execute(
    params: z.infer<typeof UpdateNotificationPreferenceToolSchema>,
    context: ToolContext,
  ): Promise<UpdateNotificationPreferenceResult> {
    const preference = await this.notificationPreferenceStore.getById(params.preferenceId);

    if (!preference || preference.userId !== context.userId) {
      return {
        success: false,
        message: `Notification preference not found or you do not have permission to update it.`,
      };
    }

    await this.notificationPreferenceStore.update(params.preferenceId, {
      triggerType: params.triggerType,
      triggerConfig: params.triggerConfig,
      messageTemplate: params.messageTemplate,
      importance: params.importance,
      active: params.active,
    });

    return {
      success: true,
      message: `✅ Notification preference has been updated successfully.`,
    };
  }
}
