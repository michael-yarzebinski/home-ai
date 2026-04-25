// src/tools/default/list-notification-preferences.tool.ts
import { z } from 'zod';
import type { NotificationPreference } from '@home-ai/shared/domain/notification-preference/notification-preference';
import { NotificationPreferenceStore } from 'src/core/stores/notification-preference/notification-preference.store';
import { ToolHandler } from 'src/tools/abstract/tool-handler';
import { ToolContext } from 'src/tools/types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const ListNotificationPreferencesToolSchema = z.object({});

export interface ListNotificationPreferencesResult {
  preferences: NotificationPreference[];
  total: number;
}

@Tool()
@Injectable()
export class ListNotificationPreferencesTool extends ToolHandler<
  typeof ListNotificationPreferencesToolSchema,
  ListNotificationPreferencesResult
> {
  readonly name = 'list-notification-preferences';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'List all notification preferences for the current user. ' + 'Use this tool to see what notifications are currently configured.';

  readonly parameters = ListNotificationPreferencesToolSchema;

  constructor(private readonly notificationPreferenceStore: NotificationPreferenceStore) {
    super();
  }

  async execute(
    _params: z.infer<typeof ListNotificationPreferencesToolSchema>,
    context: ToolContext,
  ): Promise<ListNotificationPreferencesResult> {
    const userPreferences = await this.notificationPreferenceStore.getByUserId(context.userId);

    return {
      preferences: userPreferences,
      total: userPreferences.length,
    };
  }
}
