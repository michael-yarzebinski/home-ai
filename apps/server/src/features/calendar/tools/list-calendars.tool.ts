import { z } from "zod";
import { ToolHandler } from "../../../tools/abstract/tool-handler";
import { CalendarStore } from "../stores/calendar.store";
import type { ToolContext } from "../../../tools/types/tool-context";
import type { Calendar } from "@home-ai/shared/domain/calendar/calendar";
import { addPermissionFlags } from "src/common/utils/permissions";
import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/decorators/tool.decorator";

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
export class ListCalendarsTool extends ToolHandler<
  typeof ListCalendarsToolSchema,
  ListCalendarsResult
> {
  readonly name = "list-calendars";
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    "List calendars registered in Home AI; returns only calendars this user may see (canRead/canWrite on each row). " +
    "Use discover-calendars only when you need calendars from the Apple Calendar app before registering them in Home AI.";

  readonly parameters = ListCalendarsToolSchema;

  constructor(private readonly calendarStore: CalendarStore) {
    super();
  }

  async execute(
    _params: z.infer<typeof ListCalendarsToolSchema>,
    context: ToolContext,
  ): Promise<ListCalendarsResult> {
    const calendars = await this.calendarStore.getAll(context.requestUser);
    const availableCalendars = addPermissionFlags(calendars, context.userRole);

    return {
      calendars: availableCalendars,
      total: availableCalendars.length,
    };
  }
}
