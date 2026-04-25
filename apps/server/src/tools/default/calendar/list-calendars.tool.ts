// src/tools/default/list-calendars.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import { CalendarStore } from '../../../core/stores/calendar/calendar.store';
import type { ToolContext } from '../../types/tool-context';
import type { Calendar } from '@home-ai/shared/domain/calendar/calendar';
import { addPermissionFlags } from 'src/common/utils/permissions';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';

const ListCalendarsToolSchema = z.object({});

export interface ListCalendarsResult {
  calendars: Array<
    Calendar & {
      canRead: boolean;
      canWrite: boolean;
    }
  >;
  total: number;
}

@Tool()
@Injectable()
export class ListCalendarsTool extends ToolHandler<typeof ListCalendarsToolSchema, ListCalendarsResult> {
  readonly name = 'list-calendars';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'List all calendars that are registered in the system. ' + 'Returns only calendars the current user has permission to see.';

  readonly parameters = ListCalendarsToolSchema;

  constructor(private readonly calendarStore: CalendarStore) {
    super();
  }

  async execute(
    _params: z.infer<typeof ListCalendarsToolSchema>,
    context: ToolContext,
  ): Promise<ListCalendarsResult> {
    let calendars = await this.calendarStore.getAll();

    const availableCalendars = addPermissionFlags(calendars, context.userRole);

    return {
      calendars: availableCalendars,
      total: availableCalendars.length,
    };
  }
}
